function ProductCard({ product, showActions, onEdit, onDelete }) {
    return (
      <article
        className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
      >
        <div className="relative aspect-4/3 overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            />
          <span className="h-full w-full object-cover transition-indigo-600 shadow">
            ₱{Number(product.price).toLocaleString()}
          </span>
        </div>
  
        <div className="p-5">
          <h3 className="text-lg font-semibold text-slate-900">
            {product.name}
          </h3>
  
          <p className="mt-1 text-sm text-slate-500">
            {product.description}
          </p>
  
          {showActions && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => onEdit(product)}
                className="flex-1 rounded-lg bg-slate-100 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Edit
              </button>
  
              <button
                onClick={() => onDelete(product._id)}
                className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </article>
    );
  }
  
  export default ProductCard;
  