#include <napi.h>
#include <iostream>
#include "duckdb.hpp"
#include "result_wrapper.h"
#include "async_worker.h"

using namespace duckdb;

AsyncExecutor::AsyncExecutor(Napi::Env &env, std::string &query, std::shared_ptr<duckdb::Connection> &connection, Napi::Promise::Deferred &deferred, bool forceMaterialized) : Napi::AsyncWorker(env), query(query), connection(connection), deferred(deferred), forceMaterialized(forceMaterialized) {}

AsyncExecutor::~AsyncExecutor() {}

void AsyncExecutor::Execute() 
{
    try
    {
        if (forceMaterialized) {
            result = connection->Query(query);
        } else {
            result = connection->SendQuery(query);
        }
        if (!result.get()->success)
        {
            SetError(result.get()->error);
        }
    }
    catch (...)
    {
        SetError("Unknown Error: Something happened during execution of the query");
    }
}

void AsyncExecutor::OnOK() 
{
    Napi::HandleScope scope(Env());
    Napi::Object result_wrapper = ResultWrapper::Create();
    ResultWrapper *result_unwrapped = ResultWrapper::Unwrap(result_wrapper);
    if (result->type == duckdb::QueryResultType::STREAM_RESULT) {
        result_unwrapped->type = "Streaming";
    } else {
        result_unwrapped->type = "Materialized";
    }
    result_unwrapped->result = std::move(result);
    deferred.Resolve(result_wrapper);
}

void AsyncExecutor::OnError(const Napi::Error &e) 
{
    deferred.Reject(e.Value());
}

            