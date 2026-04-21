import { Eye, TrendingUp, TrendingDown } from "lucide-react";

export default function CountrySource() {
  return (
    <div className="bg-white rounded-2xl shadow p-4 flex flex-col gap-4 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-gray-800 font-normal">Country Source</h2>
          <p className="text-2xl font-meduim text-gray-900">
            93 <span className="text-green-600 text-sm font-normal">+1.3%</span>
          </p>
          <p className="text-gray-500 text-sm">Country in this month</p>
        </div>
        <button className="text-blue-600 text-sm hover:underline">
          View All
        </button>
      </div>

      {/* Country List */}
      <div className="flex flex-row justify-between gap-3">
        {/* Spain */}
        <div className="flex justify-between border border-gray-200 bg-gray-50 p-3 rounded-xl">
          <div className="flex items-center gap-2">
            <img
              src="https://flagcdn.com/w20/es.png"
              alt="Spain"
              className="w-6 h-6 rounded-full"
            />
            <span className="font-medium text-gray-700">Spain</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 text-xs rounded-md font-medium">
              <Eye className="w-3 h-3" /> 2.37k
              <TrendingUp className="w-3 h-3" />
            </span>
            <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 text-xs rounded-md font-medium">
              36.52k <TrendingDown className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Australia */}
        <div className="flex justify-between border border-gray-200 bg-gray-50 p-3 rounded-xl">
          <div className="flex items-center gap-2">
            <img
              src="https://flagcdn.com/w20/au.png"
              alt="Australia"
              className="w-6 h-6 rounded-full"
            />
            <span className="font-medium text-gray-700">Australia</span>
          </div>
           <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 text-xs rounded-md font-medium">
              <Eye className="w-3 h-3" /> 2.37k
              <TrendingUp className="w-3 h-3" />
            </span>
            <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 text-xs rounded-md font-medium">
              36.52k <TrendingDown className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
