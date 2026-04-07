
export const useApi = () => {
  /**
   * Common Request Wrapper
   * @param {string} url - The endpoint
   * @param {string} method - GET, POST, PUT, DELETE
   * @param {object} body - The data to send (optional)
   */
  const request = async (url, method = "GET", body = null) => {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(url, options);
        const data = await response.json();

        if (response.ok) {
          // Resolve the promise with the data
          resolve(data);
        } else {
          // Reject with the error message from the server
          reject(data || { message: "Something went wrong" });
        }
      } catch (error) {
        // Reject on network/parsing errors
        reject(error);
      }
    });
  };

  // Exported Methods
  return {
    get: (url) => request(url, "GET"),
    post: (url, body) => request(url, "POST", body),
    put: (url, body) => request(url, "PUT", body),
    del: (url) => request(url, "DELETE"),
  };
};