"use client";

import React from "react"; 
import EditBrand from "../page";

export default function EditBrandPage({ params }) {
  const resolvedParams = React.use(params); // Unwrap the params Promise
  console.log("Params received:", resolvedParams); // Debug to verify the id
  return <EditBrand brandId={resolvedParams.id} />;
}