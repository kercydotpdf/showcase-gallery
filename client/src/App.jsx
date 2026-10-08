import { useState } from "react";
import Navbar from "./components/Navbar";
import GalleryPage from "./pages/GalleryPage";
import ManagePage from "./pages/ManagePage";

function App() {
  const [products, setProducts] = useState([]);
  const [view, setView] = useState("gallery");
  const [editingProduct, setEditingProduct] = useState(null);

  const saveProduct = (data) => {
    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p._id === editingProduct._id ? { ...p, ...data } : p
        )
      );
      setEditingProduct(null);
    } else {
      setProducts((prev) => [
        {
          _id: crypto.randomUUID(),
          ...data,
        },
        ...prev,
      ]);
    }
  };

  const deleteProduct = (id) => {
    if (!confirm("Delete this product?")) return;

    setProducts((prev) => prev.filter((p) => p._id !== id));

    if (editingProduct?._id === id) {
      setEditingProduct(null);
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
        <GalleryPage
          products={products}
          loading={false}
        />
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