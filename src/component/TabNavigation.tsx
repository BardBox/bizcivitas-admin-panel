import { Upload, FileText, Bookmark } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string | undefined }>;
}

interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const tabs: Tab[] = [
  { id: 'upload', label: 'Upload Media', icon: Upload },
  { id: 'library', label: 'Media Library', icon: FileText },
  { id: 'saved', label: 'Saved Media', icon: Bookmark },
];

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
      <div className="flex flex-wrap justify-center">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 sm:px-6 sm:py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabNavigation;