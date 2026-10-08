function Navbar({ view, onChangeView }) {
    const navClass = (name) =>
      `rounded-full px-5 py-2 text-sm font-medium transition ${
        view === name
          ? "bg-slate-900 text-white shadow-md shadow-slate-900/25"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      }`;
  
    return (
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold tracking-tight">
            Showcase
            <span className="ml-1 text-indigo-600">Gallery</span>
          </h1>
  
          <div className="flex gap-1 rounded-full bg-slate-100 p-1">
            <button
              className={navClass("gallery")}
              onClick={() => onChangeView("gallery")}
            >
              Gallery
            </button>
  
            <button
              className={navClass("manage")}
              onClick={() => onChangeView("manage")}
            >
              Manage
            </button>
          </div>
        </div>
      </header>
    );
  }
  
  export default Navbar;