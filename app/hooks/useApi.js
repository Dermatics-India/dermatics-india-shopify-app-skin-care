// Thin fetch wrapper used throughout the admin UI.
// Resolves with parsed JSON on 2xx, rejects with the parsed error payload
// (or { message: "..." }) on non-2xx responses.
export const useApi = () => {
  const request = async (url, method = "GET", body = null, isMultipart = false) => {
    const options = { method, headers: {} };

    if (!isMultipart) {
      options.headers["Content-Type"] = "application/json";
    }

    if (body) {
      options.body = isMultipart ? body : JSON.stringify(body);
    }

    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          resolve(data);
        } else {
          reject(data || { message: "Something went wrong" });
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  return {
    get: (url) => request(url, "GET"),
    post: (url, body) => request(url, "POST", body),
    postFormData: (url, formData) => request(url, "POST", formData, true),
    put: (url, body) => request(url, "PUT", body),
    del: (url) => request(url, "DELETE"),
  };
};
