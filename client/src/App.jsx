import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import GalleryPage from "./pages/GalleryPage";
import ManagePage from "./pages/ManagePage";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct as apiDeleteProduct,
} from "./api";

function App() {
  const [products, setProducts] = useState([]);
  const [view, setView] = useState("gallery");
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveProduct = async (data) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct._id, data);
        setEditingProduct(null);
      } else {
        await createProduct(data);
      }

      await loadProducts();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;

    try {
      await apiDeleteProduct(id);

      if (editingProduct?._id === id) {
        setEditingProduct(null);
      }

      await loadProducts();
    } catch (error) {
      console.error(error);
    }
  };

  const startEdit = (product) => {
    setEditingProduct(product);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Navbar view={view} onChangeView={setView} />

      {view === "gallery" ? (
        <GalleryPage products={products} loading={loading} />
      ) : (
        <ManagePage
          products={products}
          editingProduct={editingProduct}
          onSave={saveProduct}
          onCancel={() => setEditingProduct(null)}
          onEdit={startEdit}
          onDelete={deleteProduct}
        />
      )}

      <footer className="py-10 text-center text-sm text-slate-400">
        Made by John Tamayo • INF232
      </footer>
    </div>
  );
}

export default App;