/**
 *  API Response formatter
 * Ensures consistent response structure across all endpoints
 */

class ApiResponse {
  /**
   * Success response
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    // Add metadata for paginated responses
    if (data && typeof data === 'object' && data.pagination) {
      response.pagination = data.pagination;
      response.data = data.data;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Created response (201)
   */
  static created(res, data = null, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  /**
   * No content response (204)
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Error response
   */
  static error(res, error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';
    const errors = error.errors || null;

    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    if (errors) {
      response.errors = errors;
    }

    // Add stack trace in development only (never in production)
    if (process.env.NODE_ENV === 'development' && error.stack) {
      response.stack = error.stack;
    }

    // Log error for monitoring (without exposing sensitive data)
    console.error(`API Error [${statusCode}]: ${message}`, {
      path: res.req?.path,
      method: res.req?.method,
      errorId: response.timestamp,
    });

    return res.status(statusCode).json(response);
  }

  /**
   * Paginated response
   */
  static paginated(res, data, page, limit, total, message = 'Success') {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext,
      hasPrev,
      nextPage: hasNext ? page + 1 : null,
      prevPage: hasPrev ? page - 1 : null,
    };

    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * File download response
   */
  static download(res, filePath, fileName) {
    return res.download(filePath, fileName, (error) => {
      if (error) {
        return this.error(res, error);
      }
    });
  }

  /**
   * Stream response for large data
   */
  static stream(res, stream, fileName, contentType = 'application/octet-stream') {
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    stream.pipe(res).on('error', (error) => {
      this.error(res, error);
    });
  }
}

module.exports = ApiResponse;