export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.name === 'ZodError') {
    return res.status(400).json({
      message: 'Invalid request body',
      issues: error.issues
    });
  }

  const status = error.status || 500;
  const message = status === 500 ? 'Internal server error' : error.message;

  if (status === 500) {
    console.error(error);
  }

  return res.status(status).json({ message });
}
