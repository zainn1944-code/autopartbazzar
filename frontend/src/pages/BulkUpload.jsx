import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/api/axiosInstance";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/ui/navbar.jsx";

const CSV_TEMPLATE = `name,price,category,make,city,sale,free_shipping,stock_quantity,original_price,description
Brake Pads Set,2500,Brakes,Toyota,Karachi,false,true,10,3000,High quality brake pads
Air Filter,800,Filters,Honda,Lahore,true,false,25,1200,OEM compatible air filter
`;

export default function BulkUpload() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isAdmin) {
    navigate("/home");
    return null;
  }

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f && f.name.endsWith(".csv")) {
      setFile(f);
      setError(null);
    } else {
      setError("Please select a valid CSV file.");
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await axiosInstance.post("/products/bulk-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Bulk Product Upload</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Upload a CSV file to add multiple products at once.
        </p>

        {/* Template download */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-300 mb-2 font-medium">
            Required columns: <code>name, price, category</code>
            <br />
            Optional: <code>make, city, sale, free_shipping, stock_quantity, original_price, description</code>
          </p>
          <button
            onClick={downloadTemplate}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded font-medium transition"
          >
            Download CSV Template
          </button>
        </div>

        {/* Upload area */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-10 text-center cursor-pointer hover:border-red-400 transition mb-4"
        >
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          {file ? (
            <div>
              <p className="text-green-600 dark:text-green-400 font-semibold">{file.name}</p>
              <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">Click to select a CSV file</p>
              <p className="text-sm text-gray-400 mt-1">or drag and drop</p>
            </div>
          )}
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload Products"}
        </button>

        {/* Results */}
        {result && (
          <div className="mt-8">
            <p className="font-semibold text-gray-900 dark:text-white mb-3">{result.message}</p>

            {result.created?.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 mb-4">
                <p className="text-green-700 dark:text-green-400 font-medium mb-2">
                  Created ({result.created.length})
                </p>
                <ul className="text-sm text-green-600 dark:text-green-300 space-y-1">
                  {result.created.map((c) => (
                    <li key={c.product_id}>
                      Row {c.row}: <strong>{c.name}</strong> (ID: {c.product_id})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.errors?.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4">
                <p className="text-red-700 dark:text-red-400 font-medium mb-2">
                  Errors ({result.errors.length})
                </p>
                <ul className="text-sm text-red-600 dark:text-red-300 space-y-1">
                  {result.errors.map((e, i) => (
                    <li key={i}>Row {e.row}: {e.error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
