import {
    ArrowLeft,
    Menu,
    Globe,
    Search,
    Loader2
} from 'lucide-react';
import Brand from '../brand/page';
import CreateBrand from '../brand/create/page';
import ReuseBrand from '../brand/reuse/page';
import SalesReport from '../../components/SalesReport';
import Statistics from '../../components/Statistics';
import ProductsTable from '../../components/ProductsTable';
import Statement from '../../components/Statement';
import TeamActivity from '../../components/TeamActivity';
import SocialSource from '../../components/SocialSource';
import CountrySource from '../../components/CountrySource';
import Transactions from '../../components/Transactions';



const Overview = ({ isPanelOpen, setIsPanelOpen, setActiveTab, activeTab, activeBrandView }) => {


    if (activeBrandView === "create") {
        return <CreateBrand />;
    }

    if (activeBrandView === "reuse") {
        return <ReuseBrand />;
    }


    return (
        <div className=''>

            <div className="py-6 sm:px-12">
                <div className='flex flex-col w-full'>
                    <div className="grid   grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-lg  border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Sales</p>
                                    <p className="text-2xl font-semibold text-sky-600">6.5k</p>
                                </div>

                                <div className='p-2 bg-sky-100 rounded-2xl'>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="h-8 w-8 text-sky-500"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
                                        />
                                    </svg>
                                </div>

                            </div>

                            <div className='flex '>
                                <div className='mt-3'>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="size-4 text-green-600"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"></path></svg>
                                </div>
                                <div>
                                    <p className="text-sm px-0.5 text-green-600 mt-3">4.3%</p>
                                </div>

                            </div>

                        </div>


                        <div className="bg-white p-6 rounded-lg  border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Customers</p>
                                    <p className="text-xl font-semibold text-amber-500">12k</p>
                                </div>
                                <div className='p-2 bg-amber-100 rounded-2xl'>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="#FF5733"
                                        className="h-6 w-6"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                                        />
                                    </svg>

                                </div>
                            </div>
                            <div className='flex '>
                                <div className='mt-3'>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="size-4 text-green-600"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"></path></svg>
                                </div>
                                <div>
                                    <p className="text-sm px-0.5 text-green-600 mt-3">7.2%</p>
                                </div>

                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg  border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Products</p>
                                    <p className="text-2xl font-semibold text-green-600">47k</p>
                                </div>

                                <div className='p-2 bg-gray-200 rounded-2xl'>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="h-6 w-6 text-green-600"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                                        />
                                    </svg>

                                </div>
                            </div>
                            <div className='flex '>
                                <div className='mt-3'>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="size-4 text-green-600"><path strokeLinecap="round" strokeline="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"></path></svg>
                                </div>
                                <div>
                                    <p className="text-sm px-0.5 text-green-600 mt-3">8%</p>
                                </div>

                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg  border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Revenue</p>
                                    <p className="text-2xl font-semibold text-[#b8008c]">$128k</p>
                                </div>
                                <div className='p-2 bg-[#fbc8ef8f] rounded-2xl'>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="h-6 w-6 text-[#b8008c]"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                        />
                                    </svg>

                                </div>
                            </div>
                            <div className='flex '>
                                <div className='mt-3'>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" data-slot="icon" className="size-4 text-green-600"><path strokeLinecap="round" strokeline="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"></path></svg>
                                </div>
                                <div>
                                    <p className="text-sm px-0.5 text-green-600 mt-3">3.69%</p>
                                </div>

                            </div>
                        </div>
                    </div>

                    <div className='flex flex-col w-full lg:flex-row py-5 justify-between gap-4'>
                        <div className='lg:w-[65%] h-full'>
                            <SalesReport />
                        </div>
                        <div className='flex lg:w-[35%]'>
                            <Statistics />
                        </div>
                    </div>

                    <div className='flex flex-col lg:flex-row justify-between gap-4'>
                        <div className='lg:w-[75%]'>
                            <ProductsTable />
                        </div>

                        <div className='lg:w-[25%]'>
                            <Statement />
                        </div>
                    </div>

                    <div className='flex flex-row gap-4'>
                        <div className='flex-1'>
                            <TeamActivity />
                        </div>

                        <div className='flex-1 flex-col flex gap-4'>
                            <div>
                                <SocialSource />
                            </div>

                            <div>
                                <CountrySource />
                            </div>

                        </div>

                        <div className='flex-1'>
                            <Transactions />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
