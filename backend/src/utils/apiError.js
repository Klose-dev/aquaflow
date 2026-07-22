export const errorResponse = (res, message = "Something went wrong", statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    message,
  });
};
