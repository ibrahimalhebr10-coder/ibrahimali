import { Camera, Clock, MapPin, Leaf, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface FarmPhoto {
  id: string;
  url: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: 'planting' | 'growth' | 'maintenance' | 'harvest';
}

interface SmartPhotoGalleryProps {
  farmName: string;
}

export default function SmartPhotoGallery({ farmName }: SmartPhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<FarmPhoto | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const photos: FarmPhoto[] = [
    {
      id: '1',
      url: 'https://images.pexels.com/photos/1402787/pexels-photo-1402787.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'بداية الزراعة',
      description: 'تم غرس أشجارك بنجاح في تربة خصبة',
      date: '15 يناير 2024',
      location: 'القصيم، السعودية',
      category: 'planting'
    },
    {
      id: '2',
      url: 'https://images.pexels.com/photos/1300510/pexels-photo-1300510.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'نمو الأشجار',
      description: 'أشجارك تنمو بشكل صحي وقوي',
      date: '10 مارس 2024',
      location: 'القصيم، السعودية',
      category: 'growth'
    },
    {
      id: '3',
      url: 'https://images.pexels.com/photos/2255801/pexels-photo-2255801.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'عملية الري',
      description: 'نظام ري حديث يضمن نمو مثالي',
      date: '5 أبريل 2024',
      location: 'القصيم، السعودية',
      category: 'maintenance'
    },
    {
      id: '4',
      url: 'https://images.pexels.com/photos/1459505/pexels-photo-1459505.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'الأزهار',
      description: 'أشجارك بدأت في الإزهار',
      date: '20 مايو 2024',
      location: 'القصيم، السعودية',
      category: 'growth'
    },
    {
      id: '5',
      url: 'https://images.pexels.com/photos/2255801/pexels-photo-2255801.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'عملية التقليم',
      description: 'الاعتناء بصحة أشجارك',
      date: '15 يونيو 2024',
      location: 'القصيم، السعودية',
      category: 'maintenance'
    },
    {
      id: '6',
      url: 'https://images.pexels.com/photos/1002703/pexels-photo-1002703.jpeg?auto=compress&cs=tinysrgb&w=400',
      title: 'الثمار الأولى',
      description: 'ظهرت أولى ثمار أشجارك',
      date: '1 أغسطس 2024',
      location: 'القصيم، السعودية',
      category: 'harvest'
    }
  ];

  const categories = [
    { id: 'all', label: 'الكل', count: photos.length },
    { id: 'planting', label: 'الزراعة', count: photos.filter(p => p.category === 'planting').length },
    { id: 'growth', label: 'النمو', count: photos.filter(p => p.category === 'growth').length },
    { id: 'maintenance', label: 'الصيانة', count: photos.filter(p => p.category === 'maintenance').length },
    { id: 'harvest', label: 'الحصاد', count: photos.filter(p => p.category === 'harvest').length }
  ];

  const filteredPhotos = selectedCategory === 'all'
    ? photos
    : photos.filter(p => p.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'planting': return 'from-green-500 to-emerald-600';
      case 'growth': return 'from-blue-500 to-cyan-600';
      case 'maintenance': return 'from-amber-500 to-orange-600';
      case 'harvest': return 'from-purple-500 to-pink-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="text-right">
              <h3 className="text-xl font-bold text-gray-800">معرض مزرعتك</h3>
              <p className="text-sm text-gray-600 mt-1">تحديثات مرئية من {farmName}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.label} ({category.count})
              </button>
            ))}
          </div>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-2 gap-3">
          {filteredPhotos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="relative group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <img
                src={photo.url}
                alt={photo.title}
                className="w-full h-40 object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-100 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white text-right">
                  <p className="font-bold text-sm mb-1">{photo.title}</p>
                  <div className="flex items-center gap-1 text-xs opacity-90">
                    <Clock className="w-3 h-3" />
                    <span>{photo.date}</span>
                  </div>
                </div>
              </div>

              {/* Category Badge */}
              <div
                className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getCategoryColor(
                  photo.category
                )} backdrop-blur-sm shadow-lg`}
              >
                <Leaf className="w-3 h-3 inline-block" />
              </div>
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <p className="text-sm text-gray-600">آخر تحديث</p>
              <p className="text-lg font-bold text-blue-800">منذ يومين</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">إجمالي الصور</p>
              <p className="text-lg font-bold text-blue-800">{photos.length}</p>
            </div>
            <div className="text-left">
              <p className="text-sm text-gray-600">هذا الشهر</p>
              <p className="text-lg font-bold text-blue-800">3 صور</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Photo Viewer */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.title}
              className="w-full rounded-2xl shadow-2xl mb-4"
            />

            <div className="bg-white rounded-2xl p-5">
              <h3 className="text-xl font-bold text-gray-800 text-right mb-2">
                {selectedPhoto.title}
              </h3>
              <p className="text-gray-600 text-right mb-4">
                {selectedPhoto.description}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{selectedPhoto.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedPhoto.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
