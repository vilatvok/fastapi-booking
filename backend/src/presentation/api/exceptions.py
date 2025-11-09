from fastapi.responses import JSONResponse


async def repository_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={'message': str(exc)},
    )


async def invalid_data_error_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={'message': str(exc)},
    )


async def already_exists_error_handler(request, exc):
    return JSONResponse(
        status_code=409,
        content={'message': str(exc)},
    )


async def validation_error_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={'message': str(exc)},
    )


async def not_found_error_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={'message': str(exc)},
    )


async def permission_error_handler(request, exc):
    return JSONResponse(
        status_code=403,
        content={'message': str(exc)},
    )
