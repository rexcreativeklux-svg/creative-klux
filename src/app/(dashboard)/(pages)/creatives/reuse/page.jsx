import { Plus } from "lucide-react";



const ReuseCreative = ({onGenerateClick}) => (
  <div className="flex flex-col py-5 px-5">
  <h1 className="text-2xl px-4 pt-10 font-semibold">Generated Creatives</h1>

    <div
      className="px-5 hover:border-[#155dfc] flex flex-col mt-10 space-y-4 justify-center items-center border rounded-md border-gray-200 w-[300px] h-[200px] py-5 cursor-pointer"

    >
      <div className="p-2 border-2 rounded-full border-gray-600">
        <Plus strokeWidth={2} className="w-10 h-10 text-gray-600" />
      </div>
      <h1 className="font-meduim text-gray-700 py-1">Create New Creative</h1>

      <button
        onClick={onGenerateClick}
        className="bg-[#155dfc] cursor-pointer text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
      >
        Get Started
      </button>
    </div>
  </div>
);
export default ReuseCreative;
