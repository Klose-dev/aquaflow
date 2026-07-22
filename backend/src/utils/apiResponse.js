export const successResponse = (res, data, message = "Success", statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const createdResponse = (res, data, message = "Created") => {
  res.status(201).json({
    success: true,
    message,
    data,
  });
};
