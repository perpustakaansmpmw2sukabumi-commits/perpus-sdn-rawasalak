"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Search, Menu, X, Home, Book, Bookmark, 
  Info, Phone, LogIn, LayoutDashboard, Settings, 
  PlusCircle, Trash2, Edit, FileText, ChevronRight, 
  ChevronLeft, Maximize, ZoomIn, ZoomOut, Upload, Download,
  Users, BarChart3, AlertCircle, CheckCircle2, ArrowLeft
} from 'lucide-react';

// ==========================================
// KONFIGURASI DATABASE
// ==========================================
// URL Web App Google Apps Script yang Anda berikan
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxBbT3thcFW33Sjd2UFHQQKN3japCPYVCPpQuHf5VOsWzQnV5IiscdowdZ2aAYLz06QfQ/exec';

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface BookItem {
  id: string;
  judul: string;
  penulis: string;
  penerbit: string;
  tahun: string;
  isbn: string;
  halaman: number;
  kategori: string;
  kelas: string;
  sinopsis: string;
  linkBuku: string;
  gdriveId: string;
  linkSampul: string;
  status: 'publik' | 'draft';
  jumlahDibaca: number;
}

interface AppState {
  books: BookItem[];
  settings: {
    namaSekolah: string;
    logoUrl: string;
    alamat: string;
    whatsapp: string;
    namaKepalaSekolah: string;
    fotoKepalaSekolah: string;
    sambutan: string;
  };
  loading: boolean;
  searchQuery: string;
  favorites: string[];
  history: string[];
}

// ==========================================
// UTILITIES
// ==========================================
const extractGDriveId = (url: string) => {
  const match = url.match(/(?:d\/|id=)([\w-]+)/);
  return match ? match[1] : '';
};

const getDummyCover = (title: string) => 
  `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=3b82f6&color=fff&size=400&font-size=0.1&length=1`;

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function App() {
  const [route, setRoute] = useState('/');
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [state, setState] = useState<AppState>({
    books: [],
    settings: {
      namaSekolah: 'SDN Rawasalak',
      logoUrl: '',
      alamat: 'Jl. Contoh Alamat No. 123',
      whatsapp: '6281234567890',
      namaKepalaSekolah: 'Bpk/Ibu Kepala Sekolah',
      fotoKepalaSekolah: '',
      sambutan: 'Selamat datang di Perpustakaan Digital SDN Rawasalak. Membaca hari ini, hebat di masa depan!'
    },
    loading: true,
    searchQuery: '',
    favorites: [],
    history: []
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  // Load Initial Data (Fetching API dari Google Spreadsheet)
  useEffect(() => {
    const loadData = async () => {
      setState(s => ({ ...s, loading: true }));
      try {
        // Fetch data buku dari Spreadsheet
        const res = await fetch(`${APPS_SCRIPT_URL}?action=getBooks`);
        const result = await res.json();
        
        // Fetch data pengaturan dari Spreadsheet
        const resSettings = await fetch(`${APPS_SCRIPT_URL}?action=getSettings`);
        const resultSettings = await resSettings.json();
        
        let fetchedBooks = [];
        if (result.success && result.data) {
          // Memetakan data dari Spreadsheet ke interface BookItem aplikasi
          fetchedBooks = result.data.map((b: any) => ({
            id: b.id_buku,
            judul: b.judul,
            penulis: b.penulis,
            penerbit: b.penerbit,
            tahun: b.tahun_terbit,
            isbn: b.isbn,
            halaman: b.jumlah_halaman,
            kategori: b.kategori,
            kelas: b.kelas_rekomendasi,
            sinopsis: b.sinopsis,
            linkBuku: b.link_buku,
            gdriveId: extractGDriveId(b.link_buku || ''),
            linkSampul: b.link_sampul,
            status: b.status || 'publik',
            jumlahDibaca: b.jumlah_dibaca || 0
          }));
        }

        const savedFavs = JSON.parse(localStorage.getItem('favBooks') || '[]');
        const savedHist = JSON.parse(localStorage.getItem('histBooks') || '[]');
        
        // Memetakan pengaturan
        let newSettings = state.settings;
        if (resultSettings.success && resultSettings.data && Object.keys(resultSettings.data).length > 0) {
          const sData = resultSettings.data;
          newSettings = {
            namaSekolah: sData.nama_sekolah || 'SDN Rawasalak',
            logoUrl: sData.logo_url || '',
            alamat: sData.alamat || 'Jl. Contoh Alamat No. 123',
            whatsapp: sData.whatsapp || '6281234567890',
            namaKepalaSekolah: sData.nama_kepala_sekolah || 'Bpk/Ibu Kepala Sekolah',
            fotoKepalaSekolah: sData.foto_kepala_sekolah || '',
            sambutan: sData.sambutan_kepala_sekolah || 'Selamat datang di Perpustakaan Digital SDN Rawasalak. Membaca hari ini, hebat di masa depan!'
          };
        }
        
        setState(s => ({ 
          ...s, 
          books: fetchedBooks,
          settings: newSettings,
          favorites: savedFavs,
          history: savedHist,
          loading: false 
        }));
      } catch (e) {
        console.error("Fetch error:", e);
        showToast('Gagal memuat data dari Spreadsheet', 'error');
        setState(s => ({ ...s, loading: false }));
      }
    };
    loadData();
  }, []);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const navigate = (path: string, params?: any) => {
    window.scrollTo(0, 0);
    setRoute(path);
    if (params?.id) setActiveBookId(params.id);
  };

  // ==========================================
  // VIEW RENDERER
  // ==========================================
  const renderView = () => {
    if (state.loading) return <LoadingScreen />;

    switch (route) {
      case '/': return <HomeView state={state} navigate={navigate} />;
      case '/katalog': return <CatalogView state={state} navigate={navigate} />;
      case '/detail': return <DetailView state={state} bookId={activeBookId} navigate={navigate} />;
      case '/baca': return <ReaderView state={state} bookId={activeBookId} navigate={navigate} />;
      case '/admin/login': return <AdminLoginView setIsAdmin={setIsAdmin} navigate={navigate} showToast={showToast} />;
      case '/admin/dashboard': return isAdmin ? <AdminDashboard state={state} navigate={navigate} /> : <AdminLoginView setIsAdmin={setIsAdmin} navigate={navigate} showToast={showToast} />;
      case '/admin/buku': return isAdmin ? <AdminBooks state={state} setState={setState} navigate={navigate} showToast={showToast} /> : <AdminLoginView setIsAdmin={setIsAdmin} navigate={navigate} showToast={showToast}/>;
      case '/admin/pengaturan': return isAdmin ? <AdminSettingsView state={state} setState={setState} navigate={navigate} showToast={showToast} /> : <AdminLoginView setIsAdmin={setIsAdmin} navigate={navigate} showToast={showToast}/>;
      default: return <HomeView state={state} navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-yellow-300 selection:text-blue-900">
      {!route.startsWith('/admin') && <Navbar navigate={navigate} currentRoute={route} settings={state.settings} />}
      
      <main className={!route.startsWith('/admin') && route !== '/baca' ? 'pt-20 pb-16' : ''}>
        {renderView()}
      </main>

      {!route.startsWith('/admin') && route !== '/baca' && <Footer settings={state.settings} />}
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-xl z-50 flex items-center gap-3 text-white animate-bounce-short ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="font-medium">{toast.msg}</p>
        </div>
      )}
    </div>
  );
}

// ==========================================
// COMPONENTS
// ==========================================
const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
    <p className="text-blue-800 font-bold text-lg animate-pulse">Menyiapkan Buku...</p>
  </div>
);

const Navbar = ({ navigate, currentRoute, settings }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const links = [
    { name: 'Beranda', path: '/' },
    { name: 'Katalog', path: '/katalog' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-40 border-b-4 border-yellow-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center gap-3">
            {/* Bagian Logo: Rahasia untuk masuk ke Panel Admin */}
            <div className="cursor-pointer transition-transform hover:scale-105" onClick={() => navigate('/admin/login')} title="Area Admin">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo Sekolah" className="h-12 w-12 object-contain" />
              ) : (
                <div className="bg-blue-600 p-2 rounded-xl">
                  <BookOpen className="h-8 w-8 text-yellow-400" />
                </div>
              )}
            </div>
            
            {/* Bagian Teks: Untuk kembali ke Beranda */}
            <div className="cursor-pointer" onClick={() => navigate('/')}>
              <h1 className="font-bold text-xl leading-tight text-blue-900 hidden sm:block">Perpustakaan Digital</h1>
              <p className="text-sm font-semibold text-slate-500 hidden sm:block">{settings?.namaSekolah || 'SDN Rawasalak'}</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {links.map(link => (
              <button 
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`font-semibold hover:text-blue-600 transition-colors ${currentRoute === link.path ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600'}`}
              >
                {link.name}
              </button>
            ))}
            <button 
              onClick={() => navigate('/katalog')}
              className="bg-yellow-400 text-blue-900 px-6 py-2 rounded-full font-bold hover:bg-yellow-300 hover:scale-105 transition-all shadow-md"
            >
              Mulai Membaca
            </button>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-blue-900">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b-4 border-yellow-400 px-4 py-4 space-y-3 shadow-lg absolute w-full">
          {links.map(link => (
            <button 
              key={link.path}
              onClick={() => { navigate(link.path); setIsOpen(false); }}
              className="block w-full text-left font-semibold text-lg text-slate-700 p-2 rounded-lg hover:bg-blue-50"
            >
              {link.name}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

const Footer = ({ settings }: any) => (
  <footer className="bg-blue-900 text-white pt-12 pb-8 rounded-t-[3rem] mt-12">
    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
      <div>
        <div className="flex items-center gap-3 mb-4">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="h-10 w-10 object-contain bg-white rounded-lg p-1" />
          ) : (
            <BookOpen className="text-yellow-400" size={32} />
          )}
          <h2 className="text-2xl font-bold">{settings?.namaSekolah || 'SDN Rawasalak'}</h2>
        </div>
        <p className="text-blue-200 mb-6">Membaca Hari Ini, Hebat di Masa Depan. Perpustakaan digital yang ramah, mudah, dan menyenangkan untuk siswa-siswi.</p>
      </div>
      <div>
        <h3 className="text-lg font-bold mb-4 border-b border-blue-700 pb-2">Kontak Kami</h3>
        <ul className="space-y-3 text-blue-200">
          <li className="flex items-center gap-2"><Phone size={18} className="text-yellow-400"/> WhatsApp: +{settings?.whatsapp}</li>
          <li className="flex items-center gap-2"><Info size={18} className="text-yellow-400"/> {settings?.alamat}</li>
        </ul>
      </div>
      <div>
        <h3 className="text-lg font-bold mb-4 border-b border-blue-700 pb-2">Jam Layanan Online</h3>
        <p className="text-blue-200">Akses 24 Jam Non-Stop di mana saja dan kapan saja.</p>
      </div>
    </div>
    <div className="text-center mt-12 text-blue-400 text-sm">
      © {new Date().getFullYear()} {settings?.namaSekolah}. Dibuat dengan ❤️ untuk Pendidikan Indonesia.
    </div>
  </footer>
);

// ==========================================
// PUBLIC VIEWS
// ==========================================
const HomeView = ({ state, navigate }: any) => {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white pt-24 pb-32 px-6 rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <BookOpen size={400} />
        </div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <span className="inline-block py-1 px-4 rounded-full bg-blue-500 text-blue-100 font-semibold mb-6 border border-blue-400 shadow-sm">
            📚 Selamat Datang di Perpustakaan Digital
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Membaca Hari Ini,<br/><span className="text-yellow-400">Hebat di Masa Depan!</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            Jelajahi ratusan koleksi buku cerita, ensiklopedia, dan buku pelajaran {state.settings.namaSekolah} kapan saja dan di mana saja.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-lg mx-auto">
            <button 
              onClick={() => navigate('/katalog')}
              className="bg-yellow-400 text-blue-900 font-bold py-4 px-8 rounded-full text-lg shadow-lg hover:bg-yellow-300 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Search size={24} /> Cari Buku Sekarang
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-6 -mt-16 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6 border-b-4 border-yellow-400">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3 text-blue-600"><Book size={32}/></div>
            <h3 className="text-3xl font-black text-slate-800">{state.books.length}</h3>
            <p className="text-sm font-semibold text-slate-500 uppercase">Koleksi Buku</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3 text-green-600"><Users size={32}/></div>
            <h3 className="text-3xl font-black text-slate-800">0</h3>
            <p className="text-sm font-semibold text-slate-500 uppercase">Pembaca Aktif</p>
          </div>
          <div className="text-center">
            <div className="bg-yellow-100 w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3 text-yellow-600"><Bookmark size={32}/></div>
            <h3 className="text-3xl font-black text-slate-800">12</h3>
            <p className="text-sm font-semibold text-slate-500 uppercase">Kategori</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3 text-purple-600"><BarChart3 size={32}/></div>
            <h3 className="text-3xl font-black text-slate-800">24/7</h3>
            <p className="text-sm font-semibold text-slate-500 uppercase">Akses Online</p>
          </div>
        </div>
      </section>

      {/* Sambutan Kepala Sekolah */}
      <section className="max-w-7xl mx-auto px-6 mt-24">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-md border border-slate-100 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 md:w-48 md:h-48 bg-slate-200 rounded-full flex-shrink-0 border-4 border-yellow-400 overflow-hidden relative">
            {state.settings.fotoKepalaSekolah ? (
              <img src={state.settings.fotoKepalaSekolah} alt="Kepala Sekolah" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <Users size={48} />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-3xl font-black text-blue-900 mb-4">Sambutan Kepala Sekolah</h2>
            <p className="text-lg text-slate-600 italic mb-4 leading-relaxed">
              "{state.settings.sambutan}"
            </p>
            <p className="font-bold text-slate-800">{state.settings.namaKepalaSekolah}</p>
            <p className="text-sm text-slate-500">{state.settings.namaSekolah}</p>
          </div>
        </div>
      </section>

      {/* Buku Terbaru Preview */}
      <section className="max-w-7xl mx-auto px-6 mt-24">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">Buku Terbaru 🌟</h2>
            <p className="text-slate-500">Koleksi buku segar untukmu hari ini!</p>
          </div>
          <button onClick={() => navigate('/katalog')} className="hidden sm:flex text-blue-600 font-bold items-center gap-1 hover:text-blue-800">
            Lihat Semua <ChevronRight size={20}/>
          </button>
        </div>

        {state.books.length === 0 ? (
          <EmptyState title="Belum ada buku" message="Koleksi buku sedang dalam proses penyusunan oleh Admin." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {state.books.slice(0, 5).map((book: BookItem) => (
              <BookCard key={book.id} book={book} onClick={() => navigate('/detail', { id: book.id })} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const CatalogView = ({ state, navigate }: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');

  const categories = ['Semua', 'Cerita Anak', 'Pelajaran', 'Sains', 'Ensiklopedia', 'Agama'];

  const filteredBooks = state.books.filter((b: BookItem) => {
    const matchesSearch = b.judul.toLowerCase().includes(searchTerm.toLowerCase()) || b.penulis.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Semua' || b.kategori === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 pt-12 min-h-[70vh] animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-blue-900 mb-3">Katalog Buku 📚</h1>
          <p className="text-slate-600 text-lg">Temukan petualangan barumu di sini!</p>
        </div>
        
        <div className="w-full md:w-96 relative">
          <input 
            type="text" 
            placeholder="Cari judul, penulis..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
          />
          <Search className="absolute left-5 top-4 text-slate-400" size={24} />
        </div>
      </div>

      {/* Filter Kategori */}
      <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide">
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm ${categoryFilter === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid Buku */}
      {filteredBooks.length === 0 ? (
        <EmptyState title="Oops! Tidak ditemukan." message={searchTerm ? `Buku dengan kata kunci "${searchTerm}" tidak ditemukan.` : "Belum ada buku yang tersedia di katalog ini."} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 gap-y-10">
          {filteredBooks.map((book: BookItem) => (
            <BookCard key={book.id} book={book} onClick={() => navigate('/detail', { id: book.id })} />
          ))}
        </div>
      )}
    </div>
  );
};

const DetailView = ({ state, bookId, navigate }: any) => {
  const book = state.books.find((b: BookItem) => b.id === bookId);

  if (!book) return (
    <div className="pt-20 text-center"><EmptyState title="Buku Tidak Ditemukan" message="Buku yang Anda cari mungkin telah dihapus atau link tidak valid." />
    <button onClick={()=>navigate('/katalog')} className="mt-4 text-blue-600 font-bold underline">Kembali ke Katalog</button></div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 pt-12 animate-fade-in">
      <button onClick={() => navigate('/katalog')} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-semibold mb-8 transition-colors">
        <ArrowLeft size={20} /> Kembali ke Katalog
      </button>

      <div className="bg-white rounded-[2rem] shadow-xl p-6 md:p-12 border-b-8 border-yellow-400 flex flex-col md:flex-row gap-10">
        {/* Cover */}
        <div className="w-full md:w-1/3 flex-shrink-0">
          <div className="rounded-2xl overflow-hidden shadow-2xl relative group aspect-[2/3] bg-slate-100">
            <img src={book.linkSampul || getDummyCover(book.judul)} alt={book.judul} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
        </div>

        {/* Info */}
        <div className="w-full md:w-2/3 flex flex-col justify-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-800 font-bold text-sm w-max mb-4">
            {book.kategori}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4 leading-tight">{book.judul}</h1>
          <p className="text-xl text-slate-600 font-medium mb-8">Oleh: <span className="text-blue-600 font-bold">{book.penulis}</span></p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
            <div>
              <p className="text-sm text-slate-500 font-semibold mb-1">Penerbit</p>
              <p className="font-bold text-slate-800">{book.penerbit || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-semibold mb-1">Tahun</p>
              <p className="font-bold text-slate-800">{book.tahun || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-semibold mb-1">Halaman</p>
              <p className="font-bold text-slate-800">{book.halaman ? `${book.halaman} hlm` : '-'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-semibold mb-1">Dibaca</p>
              <p className="font-bold text-slate-800">{book.jumlahDibaca || 0} kali</p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-800 mb-3">Sinopsis</h3>
          <p className="text-slate-600 leading-relaxed mb-10 text-lg">
            {book.sinopsis || 'Belum ada sinopsis untuk buku ini.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-auto">
            <button 
              onClick={() => navigate('/baca', { id: book.id })}
              className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all flex items-center justify-center gap-3 flex-1"
            >
              <BookOpen size={24} /> Baca Sekarang
            </button>
            <button className="bg-white border-2 border-slate-200 text-slate-700 px-6 py-4 rounded-full font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              <Bookmark size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReaderView = ({ state, bookId, navigate }: any) => {
  const book = state.books.find((b: BookItem) => b.id === bookId);

  if (!book) return <div>Buku tidak ditemukan.</div>;

  const isGDrive = book.linkBuku?.includes('drive.google.com');
  const fileId = isGDrive ? extractGDriveId(book.linkBuku) : null;
  const embedUrl = isGDrive && fileId ? `https://drive.google.com/file/d/${fileId}/preview` : book.linkBuku;

  return (
    <div className="h-screen flex flex-col bg-slate-900 animate-fade-in">
      {/* Topbar Reader */}
      <div className="bg-slate-800 text-white h-16 flex items-center justify-between px-6 shadow-md flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/detail', { id: bookId })} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-700 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="font-bold text-lg line-clamp-1">{book.judul}</h2>
            <p className="text-xs text-slate-400">Pembaca Digital</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"><ZoomOut size={20}/></button>
           <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"><ZoomIn size={20}/></button>
           <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 ml-2 border-l border-slate-600 pl-4"><Maximize size={20}/></button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full bg-slate-950 relative">
        {embedUrl ? (
          <iframe 
            src={embedUrl} 
            className="w-full h-full border-none"
            title={`Membaca ${book.judul}`}
            allow="autoplay"
          ></iframe>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
            <AlertCircle size={64} className="mb-4 text-slate-600" />
            <h3 className="text-xl font-bold mb-2 text-white">Format Tidak Didukung</h3>
            <p>Buku ini tidak memiliki tautan yang valid atau tidak dapat di-embed.</p>
            <a href={book.linkBuku} target="_blank" rel="noreferrer" className="mt-6 px-6 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500">
              Buka di Tab Baru
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// ADMIN VIEWS
// ==========================================
const AdminLoginView = ({ setIsAdmin, navigate, showToast }: any) => {
  const [pin, setPin] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') { // Mock PIN
      setIsAdmin(true);
      showToast('Login berhasil', 'success');
      navigate('/admin/dashboard');
    } else {
      showToast('PIN Salah', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl p-10 border-t-8 border-blue-600">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard size={40} className="text-blue-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-800">Panel Admin</h2>
          <p className="text-slate-500 mt-2">Login untuk mengelola perpustakaan</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">PIN Keamanan (1234)</label>
            <input 
              type="password" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none text-center text-2xl tracking-widest font-bold text-slate-800"
              placeholder="••••"
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
            <LogIn size={20} /> Masuk Sistem
          </button>
        </form>
        <button onClick={() => navigate('/')} className="w-full mt-6 text-sm font-bold text-slate-400 hover:text-blue-600 text-center">
          &larr; Kembali ke Beranda
        </button>
      </div>
    </div>
  );
};

const AdminLayout = ({ children, navigate }: any) => {
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 fixed h-full z-10 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="text-blue-400"/> Admin Panel</h2>
          <p className="text-xs text-slate-400 mt-1">Sistem Manajemen</p>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          <button onClick={() => navigate('/admin/dashboard')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button onClick={() => navigate('/admin/buku')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
            <Book size={18} /> Kelola Buku
          </button>
          <button onClick={() => navigate('/admin/pengaturan')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
            <Settings size={18} /> Pengaturan
          </button>
        </nav>
        <div className="p-4">
          <button onClick={() => navigate('/')} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors">
            <LogOutIcon /> Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8 w-full max-w-[100vw]">
        {children}
      </main>
    </div>
  );
};

const AdminDashboard = ({ state, navigate }: any) => (
  <AdminLayout navigate={navigate}>
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-black text-slate-800">Dashboard</h1>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-blue-500">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase">Total Buku</p>
            <h3 className="text-4xl font-black text-slate-800 mt-2">{state.books.length}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Book size={24}/></div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-green-500">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase">Total Pembaca</p>
            <h3 className="text-4xl font-black text-slate-800 mt-2">0</h3>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Users size={24}/></div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-yellow-500">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase">Status Sistem</p>
            <h3 className="text-2xl font-black text-slate-800 mt-2">Online</h3>
          </div>
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl"><CheckCircle2 size={24}/></div>
        </div>
      </div>
    </div>

    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
      <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
        <BarChart3 size={40} />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">Statistik Tersedia</h3>
      <p className="text-slate-500 max-w-md mx-auto">Database telah terhubung ke Google Spreadsheet! Semua buku yang ada akan terdata di sini.</p>
    </div>
  </AdminLayout>
);

const AdminBooks = ({ state, setState, navigate, showToast }: any) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDelete = async (id: string) => {
    if(confirm('Yakin ingin menghapus buku ini?')) {
      setIsProcessing(true);
      showToast('Menghapus buku dari database...', 'success');
      
      try {
        const res = await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'deleteBook', id: id })
        });
        const json = await res.json();
        
        if(json.success) {
          setState((s: AppState) => ({...s, books: s.books.filter(b => b.id !== id)}));
          showToast('Buku berhasil dihapus!', 'success');
        } else {
          showToast('Gagal menghapus buku', 'error');
        }
      } catch(e) {
        showToast('Terjadi kesalahan koneksi', 'error');
      }
      setIsProcessing(false);
    }
  };

  if (showAddForm) {
    return <AdminLayout navigate={navigate}>
      <BookForm 
        onCancel={() => setShowAddForm(false)} 
        isProcessing={isProcessing}
        onSave={async (newBook: BookItem) => {
          setIsProcessing(true);
          showToast('Sedang menyimpan ke Spreadsheet...', 'success');
          
          try {
            // Konversi format agar sesuai header spreadsheet
            const spreadSheetData = {
              id_buku: newBook.id,
              judul: newBook.judul,
              penulis: newBook.penulis,
              penerbit: newBook.penerbit,
              tahun_terbit: newBook.tahun,
              isbn: newBook.isbn,
              jumlah_halaman: newBook.halaman,
              kategori: newBook.kategori,
              kelas_rekomendasi: newBook.kelas,
              sinopsis: newBook.sinopsis,
              link_buku: newBook.linkBuku,
              link_sampul: newBook.linkSampul,
              status: newBook.status
            };

            const res = await fetch(APPS_SCRIPT_URL, {
              method: 'POST',
              body: JSON.stringify({ action: 'addBook', data: spreadSheetData })
            });
            const json = await res.json();
            
            if(json.success) {
              setState((s: AppState) => ({...s, books: [newBook, ...s.books]}));
              setShowAddForm(false);
              showToast('Buku berhasil disimpan ke Google Sheets!', 'success');
            } else {
              showToast('Gagal menyimpan buku', 'error');
            }
          } catch(e) {
            showToast('Terjadi kesalahan jaringan', 'error');
          }
          setIsProcessing(false);
        }} 
      />
    </AdminLayout>
  }

  return (
    <AdminLayout navigate={navigate}>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Kelola Buku</h1>
          <p className="text-slate-500 mt-1">Tambah, edit, dan hapus data buku.</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-sm transition-all">
          <PlusCircle size={20} /> Tambah Buku
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
           <div className="relative w-64">
             <input type="text" placeholder="Cari buku..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
             <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
           </div>
           <button className="text-sm font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
             <Upload size={16}/> Import CSV
           </button>
        </div>
        
        {state.books.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-bold text-slate-700">Belum ada data buku</p>
            <p className="text-sm">Silakan tambah buku baru untuk mulai.</p>
          </div>
        ) : (
          <div className="overflow-x-auto relative">
            {isProcessing && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-4">Buku</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4">Tahun</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.books.map((b: BookItem) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{b.judul}</div>
                      <div className="text-xs text-slate-500">{b.penulis}</div>
                    </td>
                    <td className="p-4"><span className="bg-slate-100 px-2.5 py-1 rounded-md font-semibold text-xs text-slate-600">{b.kategori}</span></td>
                    <td className="p-4">{b.tahun}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${b.status === 'publik' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                        {b.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit size={16}/></button>
                      <button onClick={() => handleDelete(b.id)} disabled={isProcessing} className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50" title="Hapus"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const BookForm = ({ onCancel, onSave, isProcessing }: any) => {
  const [formData, setFormData] = useState<Partial<BookItem>>({
    judul: '', penulis: '', penerbit: '', tahun: '', isbn: '', 
    halaman: 0, kategori: 'Cerita Anak', kelas: 'Semua Kelas',
    sinopsis: '', linkBuku: '', linkSampul: '', status: 'publik'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBook: BookItem = {
      ...formData as BookItem,
      id: Math.random().toString(36).substr(2, 9),
      gdriveId: extractGDriveId(formData.linkBuku || ''),
      jumlahDibaca: 0
    };
    onSave(newBook);
  };

  return (
    <div className="max-w-4xl bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
        <h2 className="text-2xl font-black text-slate-800">Tambah Buku Baru</h2>
        <button onClick={onCancel} disabled={isProcessing} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Judul Buku *" value={formData.judul} onChange={(v: string) => setFormData({...formData, judul: v})} required />
          <Input label="Penulis *" value={formData.penulis} onChange={(v: string) => setFormData({...formData, penulis: v})} required />
          <Input label="Penerbit" value={formData.penerbit} onChange={(v: string) => setFormData({...formData, penerbit: v})} />
          <Input label="Tahun Terbit" type="number" value={formData.tahun} onChange={(v: string) => setFormData({...formData, tahun: v})} />
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Kategori *</label>
            <select value={formData.kategori} onChange={(e) => setFormData({...formData, kategori: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 outline-none font-medium text-slate-700">
              <option>Cerita Anak</option>
              <option>Pelajaran</option>
              <option>Sains</option>
              <option>Agama</option>
              <option>Lainnya</option>
            </select>
          </div>
          
          <Input label="Link Buku (URL PDF / GDrive) *" value={formData.linkBuku} onChange={(v: string) => setFormData({...formData, linkBuku: v})} required placeholder="https://drive.google.com/file/d/..." />
          <Input label="Link Sampul (URL Gambar)" value={formData.linkSampul} onChange={(v: string) => setFormData({...formData, linkSampul: v})} placeholder="Kosongkan untuk auto-generate" />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Sinopsis</label>
          <textarea 
            rows={4}
            value={formData.sinopsis}
            onChange={(e) => setFormData({...formData, sinopsis: e.target.value})}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 outline-none font-medium text-slate-700"
            placeholder="Tuliskan ringkasan cerita buku di sini..."
          />
        </div>

        <div className="flex items-center gap-4 pt-6 border-t border-slate-100 justify-end">
          <button type="button" onClick={onCancel} disabled={isProcessing} className="px-6 py-2.5 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50">Batal</button>
          <button type="submit" disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-2.5 rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-50">
            {isProcessing ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Menyimpan...</> : 'Simpan Buku'}
          </button>
        </div>
      </form>
    </div>
  );
};

const AdminSettingsView = ({ state, setState, navigate, showToast }: any) => {
  const [formData, setFormData] = useState(state.settings);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    showToast('Menyimpan pengaturan...', 'success');

    try {
      const spreadSheetData = {
        nama_sekolah: formData.namaSekolah,
        logo_url: formData.logoUrl,
        alamat: formData.alamat,
        whatsapp: formData.whatsapp,
        nama_kepala_sekolah: formData.namaKepalaSekolah,
        foto_kepala_sekolah: formData.fotoKepalaSekolah,
        sambutan_kepala_sekolah: formData.sambutan
      };

      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'updateSettings', data: spreadSheetData })
      });
      const json = await res.json();

      if(json.success) {
        setState((s: AppState) => ({...s, settings: formData}));
        showToast('Pengaturan berhasil disimpan!', 'success');
      } else {
        showToast('Gagal menyimpan pengaturan', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan jaringan', 'error');
    }
    setIsProcessing(false);
  };

  return (
    <AdminLayout navigate={navigate}>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800">Pengaturan Sekolah</h1>
        <p className="text-slate-500 mt-1">Ubah identitas, logo, dan sambutan kepala sekolah.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-4xl space-y-8 animate-fade-in">
        
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Profil Sekolah</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Nama Sekolah *" value={formData.namaSekolah} onChange={(v: string) => setFormData({...formData, namaSekolah: v})} required />
            <Input label="Nomor WhatsApp (Contoh: 62812...)" value={formData.whatsapp} onChange={(v: string) => setFormData({...formData, whatsapp: v})} />
            <div className="md:col-span-2">
              <Input label="Alamat Lengkap" value={formData.alamat} onChange={(v: string) => setFormData({...formData, alamat: v})} />
            </div>
            <div className="md:col-span-2">
              <Input label="Link URL Logo Sekolah (Opsional)" value={formData.logoUrl} onChange={(v: string) => setFormData({...formData, logoUrl: v})} placeholder="https://contoh.com/logo.png" />
              {formData.logoUrl && <img src={formData.logoUrl} alt="Preview Logo" className="mt-3 h-16 object-contain bg-slate-50 p-2 border rounded-lg" />}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-4 border-b pb-2">Profil Kepala Sekolah</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Nama Kepala Sekolah" value={formData.namaKepalaSekolah} onChange={(v: string) => setFormData({...formData, namaKepalaSekolah: v})} />
            <Input label="Link URL Foto Kepala Sekolah" value={formData.fotoKepalaSekolah} onChange={(v: string) => setFormData({...formData, fotoKepalaSekolah: v})} placeholder="https://contoh.com/foto.jpg" />
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Sambutan Kepala Sekolah</label>
              <textarea 
                rows={4}
                value={formData.sambutan}
                onChange={(e) => setFormData({...formData, sambutan: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 outline-none font-medium text-slate-700"
                placeholder="Tuliskan kata sambutan di sini..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50">
            {isProcessing ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Menyimpan...</> : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

// ==========================================
// REUSABLE SMALL COMPONENTS
// ==========================================
const Input = ({ label, value, onChange, type = "text", required = false, placeholder = "" }: any) => (
  <div>
    <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
    <input 
      type={type} 
      value={value || ''} 
      onChange={(e) => onChange(e.target.value)} 
      required={required}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 outline-none font-medium text-slate-700"
    />
  </div>
);

const BookCard = ({ book, onClick }: any) => (
  <div onClick={onClick} className="group cursor-pointer flex flex-col h-full bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden transform hover:-translate-y-1">
    <div className="aspect-[3/4] w-full bg-slate-100 relative overflow-hidden">
      <img 
        src={book.linkSampul || getDummyCover(book.judul)} 
        alt={book.judul} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md shadow-sm font-bold text-[10px] text-blue-700 uppercase tracking-wide">
        {book.kategori}
      </div>
    </div>
    <div className="p-4 flex flex-col flex-1">
      <h3 className="font-bold text-slate-800 line-clamp-2 leading-tight mb-1 group-hover:text-blue-600 transition-colors">{book.judul}</h3>
      <p className="text-xs font-semibold text-slate-500 mb-3">{book.penulis}</p>
      <div className="mt-auto flex justify-between items-center text-xs font-semibold text-slate-400">
        <span className="flex items-center gap-1"><BookOpen size={14}/> {book.halaman || '-'} hlm</span>
        <span>{book.tahun}</span>
      </div>
    </div>
  </div>
);

const EmptyState = ({ title, message }: { title: string, message: string }) => (
  <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 max-w-2xl mx-auto mt-8">
    <div className="bg-slate-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
      <BookOpen size={40} className="text-slate-400" />
    </div>
    <h3 className="text-2xl font-black text-slate-800 mb-3">{title}</h3>
    <p className="text-slate-500 text-lg">{message}</p>
  </div>
);

const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);