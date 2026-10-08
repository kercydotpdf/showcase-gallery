import ProductGrid from "../components/ProductGrid";

function GalleryPage({ products, loading }) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section
        className="
          relative mb-10 overflow-hidden rounded-3xl
          bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500
          p-10 text-white shadow-xl md:p-14
        "
      >
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10"></div>

        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
          Product Gallery
        </p>

        <h2 className="mt-3 text-4xl font-bold md:text-5xl">
          Discover Our Products
        </h2>

        <p className="mt-3 text-white/80">
          {products.length} items available • by John Tamayo
        </p>
      </section>

      {loading ? (
        <p className="py-20 text-center text-slate-400">
          Loading products...
        </p>
      ) : (
        <ProductGrid products={products} />
      )}
    </main>
  );
}

export default GalleryPage;