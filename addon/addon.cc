#include <napi.h>
#include "database.h"
#include "connection_wrapper.h"
#include "result_wrapper.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  Database::Init(env, exports);
  ConnectionWrapper::Init(env, exports);
  ResultWrapper::Init(env, exports);
  return exports;
}

NODE_API_MODULE(addon, InitAll)
