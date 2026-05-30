#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(FaceRecognitionModule, NSObject)

RCT_EXTERN_METHOD(
  loadModel:(NSString *)modelFileName
  withResolver:(RCTPromiseResolveBlock)resolve
  withRejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  runInference:(NSString *)modelFileName
  inputData:(NSArray *)inputData
  withResolver:(RCTPromiseResolveBlock)resolve
  withRejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  unloadAll:(RCTPromiseResolveBlock)resolve
  withRejecter:(RCTPromiseRejectBlock)reject
)

@end
