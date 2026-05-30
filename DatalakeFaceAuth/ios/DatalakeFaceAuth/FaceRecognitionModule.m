#import "FaceRecognitionModule.h"
#import "TensorFlowLiteC/TensorFlowLiteC.h"
#import <React/RCTLog.h>

/**
 * FaceRecognitionModule — Exposes TFLite inference to React Native on iOS.
 * Same methods as Android: loadModel, runInference, unloadAll.
 *
 * Implementation notes:
 * - Use TFLInterpreter from TensorFlowLiteC framework
 * - Set TFLInterpreterOptions numThreads to 2
 * - No Metal delegate — CPU only
 * - Core ML delegate is acceptable if it uses on-device processing only
 * - Dispatch inference to a serial background queue
 * - Never block the main thread
 */

@implementation FaceRecognitionModule {
  NSMutableDictionary<NSString *, TFLInterpreter *> *interpreters;
  dispatch_queue_t inferenceQueue;
}

RCT_EXPORT_MODULE(FaceRecognitionModule)

- (instancetype)init {
  self = [super init];
  if (self) {
    interpreters = [[NSMutableDictionary alloc] init];
    inferenceQueue = dispatch_queue_create("com.datalakefaceauth.inference", DISPATCH_QUEUE_SERIAL);
  }
  return self;
}

/**
 * Loads a .tflite model file from the app bundle into an Interpreter.
 */
RCT_EXPORT_METHOD(
  loadModel:(NSString *)modelFileName
  withResolver:(RCTPromiseResolveBlock)resolve
  withRejecter:(RCTPromiseRejectBlock)reject
)
{
  dispatch_async(inferenceQueue, ^{
    @try {
      if ([interpreters objectForKey:modelFileName]) {
        resolve(nil);
        return;
      }

      NSString *modelPath = [[NSBundle mainBundle] pathForResource:modelFileName
                                                              ofType:nil];
      if (!modelPath) {
        reject(@"MODEL_NOT_FOUND", [NSString stringWithFormat:@"Model %@ not found", modelFileName], nil);
        return;
      }

      NSError *error = nil;
      TFLInterpreterOptions *options = [[TFLInterpreterOptions alloc] init];
      options.numberOfThreads = 2; // CPU only — balances speed and battery
      
      TFLInterpreter *interpreter = [[TFLInterpreter alloc] initWithModelPath:modelPath
                                                                       options:options
                                                                        error:&error];
      
      if (error) {
        reject(@"LOAD_MODEL_ERROR", [error localizedDescription], error);
        return;
      }

      [interpreters setObject:interpreter forKey:modelFileName];
      resolve(nil);
    }
    @catch (NSException *exception) {
      reject(@"LOAD_MODEL_ERROR", exception.reason, nil);
    }
  });
}

/**
 * Runs inference on the loaded model with input data.
 * Returns output array and execution time.
 */
RCT_EXPORT_METHOD(
  runInference:(NSString *)modelFileName
  inputData:(NSArray *)inputData
  withResolver:(RCTPromiseResolveBlock)resolve
  withRejecter:(RCTPromiseRejectBlock)reject
)
{
  dispatch_async(inferenceQueue, ^{
    @try {
      TFLInterpreter *interpreter = [interpreters objectForKey:modelFileName];
      if (!interpreter) {
        reject(@"MODEL_NOT_LOADED", [NSString stringWithFormat:@"Model %@ not loaded", modelFileName], nil);
        return;
      }

      NSError *error = nil;
      
      // Convert input array to float buffer
      NSMutableArray *floatInput = [[NSMutableArray alloc] init];
      for (NSNumber *num in inputData) {
        [floatInput addObject:num];
      }

      // Prepare input tensor (assuming 1D input)
      TFLTensor *inputTensor = [interpreter inputTensorAtIndex:0 error:&error];
      if (error) {
        reject(@"INPUT_ERROR", [error localizedDescription], error);
        return;
      }

      // Run inference with timing
      uint64_t startTime = mach_absolute_time();
      error = nil;
      [interpreter invokeWithError:&error];
      uint64_t endTime = mach_absolute_time();
      
      if (error) {
        reject(@"INFERENCE_ERROR", [error localizedDescription], error);
        return;
      }

      // Get output tensor (assuming 512-dim float output for face embeddings)
      TFLTensor *outputTensor = [interpreter outputTensorAtIndex:0 error:&error];
      if (error) {
        reject(@"OUTPUT_ERROR", [error localizedDescription], error);
        return;
      }

      NSArray *outputShape = outputTensor.shape;
      NSMutableArray *resultArray = [[NSMutableArray alloc] init];
      
      // Assuming output is a 1D array of floats
      float *outputData = (float *)outputTensor.data.bytes;
      NSUInteger outputSize = 512; // Default embedding size
      
      for (NSUInteger i = 0; i < outputSize; i++) {
        [resultArray addObject:@(outputData[i])];
      }

      // Calculate elapsed time in milliseconds
      static mach_timebase_info_data_t timebaseInfo;
      if (timebaseInfo.denom == 0) {
        mach_timebase_info(&timebaseInfo);
      }
      uint64_t elapsedTicks = endTime - startTime;
      double elapsedMs = (double)(elapsedTicks * timebaseInfo.numer) / (timebaseInfo.denom * 1000000.0);

      NSMutableArray *response = [[NSMutableArray alloc] init];
      [response addObject:resultArray];
      [response addObject:@(elapsedMs)];

      resolve(response);
    }
    @catch (NSException *exception) {
      reject(@"INFERENCE_ERROR", exception.reason, nil);
    }
  });
}

/**
 * Unloads all interpreters and frees memory.
 */
RCT_EXPORT_METHOD(
  unloadAll:(RCTPromiseResolveBlock)resolve
  withRejecter:(RCTPromiseRejectBlock)reject
)
{
  dispatch_async(inferenceQueue, ^{
    @try {
      [interpreters removeAllObjects];
      resolve(nil);
    }
    @catch (NSException *exception) {
      reject(@"UNLOAD_ERROR", exception.reason, nil);
    }
  });
}

@end
