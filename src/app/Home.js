
// "use client";
// import { useState, useEffect } from "react";
// import Navbar from "./components/Navbar.jsx";
// import Overview from "./components/Overview.jsx";
// import Brand from "./brand/page.js";
// import Projects from "./Projects/page.jsx";
// import Analyze from "./Analyze/Analyze.jsx";
// import Predict from "./Predict/Predict.jsx";
// import Retouch from "./Retouch/Retouch.jsx";
// import Settings from "./Settings/Settings.jsx";
// import Header from "./components/Header.jsx";
// import ProtectedPage from "./components/ProtectedPage.jsx";
// import ProfilePage from "./profile/page.jsx";
// import CreateBrand from "./brand/create/page.js";
// import ReuseBrand from "./brand/reuse/page.js";
// import ImportBrand from "./brand/import/page.jsx";
// import CreateProject from "./Projects/create/page.jsx";
// import ReuseProject from "./Projects/reuse/ReusePage.jsx";
// import { getBrands } from "@/utils/localDb.js";
// import EditBrand from "./brand/edit/edit.jsx";
// import ModalPage from "./components/ModalPage.jsx";

// export default function Home() {
//   const [activeTab, setActiveTab] = useState("overview");
//   const [isPanelOpen, setIsPanelOpen] = useState(false);
//   const [brands, setBrands] = useState([]);
//   const [brandDraft, setBrandDraft] = useState(null);
//   const [brandHistory, setBrandHistory] = useState(["overview"]);
//   const [projectDraft, setProjectDraft] = useState(null);
//   const [projectHistory, setProjectHistory] = useState([]);
//   const [brandView, setBrandView] = useState(null);
//   const [projectView, setProjectView] = useState(null);
//   const [activeProject, setActiveProject] = useState(null);
//   const [activeBrand, setActiveBrand] = useState(null);
//   const [showModal, setShowModal] = useState(false);
//   const router = useRouter();
//   const pathname = usePathname();

//   useEffect(() => {
//     // Load brands and activeBrand on client side
//     setBrands(getBrands());
//     if (typeof window !== "undefined") {
//       try {
//         const savedBrand = localStorage.getItem("activeBrand");
//         if (savedBrand) {
//           setActiveBrand(JSON.parse(savedBrand));
//         } else {
//           setShowModal(true);
//         }
//       } catch (e) {
//         console.error("Failed to parse activeBrand from localStorage:", e);
//         setShowModal(true);
//       }
//     }
//   }, []);

//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       if (activeBrand) {
//         localStorage.setItem("activeBrand", JSON.stringify(activeBrand));
//       } else {
//         localStorage.removeItem("activeBrand");
//         setShowModal(true);
//       }
//     }
//   }, [activeBrand]);

//   const navigateTo = (view) => {
//     setBrandHistory((prev) => [...prev, brandView]);
//     setBrandView(view);
//     if (view === "create") {
//       setBrandDraft(null);
//       setActiveTab("Brand");
//       setShowModal(false);
//     }
//   };

//   const handleBack = () => {
//     setBrandHistory((prev) => {
//       if (prev.length === 0) return prev;
//       const lastView = prev[prev.length - 1];
//       setBrandView(lastView);
//       return prev.slice(0, -1);
//     });
//   };

//   const navigateProjectTo = (view) => {
//     setProjectHistory((prev) => [...prev, projectView]);
//     setProjectView(view);
//     setIsPanelOpen(true);
//   };

//   const handleProjectBack = () => {
//     setProjectHistory((prev) => {
//       if (prev.length === 0) return prev;
//       const lastView = prev[prev.length - 1];
//       setProjectView(lastView);
//       return prev.slice(0, -1);
//     });
//   };

//   const handleCreateClick = () => {
//     navigateTo("create");
//   };

//   const togglePanel = () => {
//     setIsPanelOpen((prev) => {
//       if (!prev) setActiveTab("Brand");
//       return !prev;
//     });
//   };

//   const handleEditBrand = (brand) => {
//     setBrandDraft({ ...brand });
//     setActiveBrand(brand);
//     if (typeof window !== "undefined") {
//       localStorage.setItem("activeBrand", JSON.stringify(brand));
//     }
//     localStorage.setItem("editBrandSource", "reusePage");
//     setActiveTab("Brand");
//     setBrandView("edit");
//   };

//   const handleUseBrand = (brand) => {
//     setBrandDraft({ ...brand });
//     setActiveBrand(brand);
//     if (typeof window !== "undefined") {
//       localStorage.setItem("activeBrand", JSON.stringify(brand));
//     }
//     setActiveTab("projects");
//     setProjectView("create");
//     setIsPanelOpen(true);
//     setShowModal(false);
//   };

//   const handleSelectBrandFromModal = (brand) => {
//     setActiveBrand(brand);
//     setShowModal(false);
//     setActiveTab("Brand");
//     setIsPanelOpen(true);
//   };

//   const handleNewBrandFromModal = () => {
//     navigateTo("create");
//   };

//   const renderBrandContent = () => {
//     switch (brandView) {
//       case "create":
//         return (
//           <CreateBrand
//             brandDraft={brandDraft}
//             brands={brands}
//             refreshBrands={() => setBrands(getBrands())}
//             setBrandView={setBrandView}
//             setActiveTab={setActiveTab}
//             isEditing={!!brandDraft}
//             setActiveBrand={setActiveBrand}
//             setBrandDraft={setBrandDraft}
//             setShowModal={setShowModal}
//             navigateProjectTo={navigateProjectTo}
//             setProjectView={setProjectView}
//           />
//         );
//       case "edit":
//         return (
//           <EditBrand
//             brandDraft={brandDraft}
//             refreshBrands={() => setBrands(getBrands())}
//             setBrandView={setBrandView}
//             setActiveTab={setActiveTab}
//             setActiveBrand={setActiveBrand}
//             setShowModal={setShowModal}
//             navigateProjectTo={navigateProjectTo}
//           />
//         );
//       case "import":
//         return (
//           <ImportBrand
//             onBack={handleBack}
//             brandDraft={brandDraft}
//             setBrandView={setBrandView}
//             setActiveTab={setActiveTab}
//             brands={brands}
//             refreshBrands={() => setBrands(getBrands())}
//             navigateProjectTo={navigateProjectTo}
//           />
//         );
//       case "reuse":
//         return (
//           <ReuseBrand
//             brands={brands}
//             setBrandDraft={setBrandDraft}
//             setActiveBrand={setActiveBrand}
//             setBrandView={setBrandView}
//             setActiveTab={setActiveTab}
//             navigateProjectTo={navigateProjectTo}
//             onEditBrand={handleEditBrand}
//             onUseBrand={handleUseBrand}
//             refreshBrands={() => setBrands(getBrands())}
//             context="page"
//             onCreateClick={handleCreateClick}
//           />
//         );
//       default:
//         return <Overview />;
//     }
//   };

//   const renderProjectContent = () => {
//     switch (projectView) {
//       case "create":
//         return (
//           <CreateProject
//             onGenerateClick={(draft) => {
//               setProjectDraft(draft);
//               navigateProjectTo("generate");
//             }}
//           />
//         );
//       case "reuse":
//         return (
//           <ReuseProject
//             onProjectClick={(proj) => {
//               setProjectDraft(proj);
//               navigateProjectTo("generate");
//             }}
//           />
//         );
//       default:
//         return <Overview />;
//     }
//   };

//   return (
   
//       <div className="flex h-screen overflow-hidden">
//         <Navbar
//           activeTab={activeTab}
//           setActiveTab={(tab) => {
//             if (showModal && !activeBrand) return;
//             setActiveTab(tab);
//             if (tab === "overview" || tab === "profile") setIsPanelOpen(false);
//             else if (!isPanelOpen) setIsPanelOpen(true);
//             if (tab !== "Brand") setBrandView(null);
//             if (tab !== "projects") setProjectView(null);
//           }}
//           togglePanel={togglePanel}
//         />
//         <main className="flex w-full h-screen overflow-hidden">
//           {isPanelOpen && activeTab !== "overview" && activeTab !== "profile" && (
//             <div className="relative py-6 w-[250px] animate-slide-in border overflow-y-auto border-gray-200">
//               {activeTab === "Brand" && <Brand setActiveBrandView={navigateTo} />}
//               {activeTab === "projects" && (
//                 <Projects setActiveProjectView={navigateProjectTo} />
//               )}
//               {activeTab === "analyze" && <Analyze />}
//               {activeTab === "predict" && <Predict />}
//               {activeTab === "retouch" && <Retouch />}
//               {activeTab === "settings" && <Settings />}
//             </div>
//           )}
//           <aside className="w-full bg-white z-50 overflow-y-auto h-full transition-all duration-300">
//             <div className="sticky top-0 z-50 bg-transparent shadow-sm">
//               <Header
//                 togglePanel={togglePanel}
//                 isPanelOpen={isPanelOpen}
//                 setIsPanelOpen={setIsPanelOpen}
//                 setActiveTab={setActiveTab}
//                 activeTab={activeTab}
//                 activeBrand={activeBrand}
//                 setActiveBrand={setActiveBrand}
//                 allBrands={brands}
//                 setBrandDraft={setBrandDraft}
//                 setBrandView={setBrandView}
//                 setProjectView={setProjectView}
//               />
//             </div>
//             {activeTab === "overview" && <Overview />}
//             {activeTab === "profile" && <ProfilePage />}
//             {activeTab === "Brand" && renderBrandContent()}
//             {activeTab === "projects" && renderProjectContent()}
//             {activeTab !== "overview" &&
//               activeTab !== "profile" &&
//               activeTab !== "Brand" &&
//               activeTab !== "projects" && <Overview />}
//             {showModal && (
//               <ModalPage
//                 brands={brands}
//                 onClose={activeBrand ? () => setShowModal(false) : null}
//                 onNewBrand={handleNewBrandFromModal}
//                 onSelectBrand={handleSelectBrandFromModal}
//                 onCreateClick={handleCreateClick}
//                   onUseBrand={handleUseBrand}
//               />
//             )}
//           </aside>
//         </main>
//       </div>
//   );
// }
