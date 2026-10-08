const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error(
    "VITE_API_URL is missing. Check the .env file or Vercel settings."
  );
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}/api/products${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return res.json();
}

export const getProducts = () => request("");

export const createProduct = (data) =>
  request("", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateProduct = (id, data) =>
  request(`/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteProduct = (id) =>
  request(`/${id}`, {
    method: "DELETE",
  });