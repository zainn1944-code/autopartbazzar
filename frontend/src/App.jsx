import { Navigate, Route, Routes } from "react-router-dom";
import PrivateRoute from "@/routes/PrivateRoute.jsx";

import About from "@/pages/About.jsx";
import AddProduct from "@/pages/AddProduct.jsx";
import AdminDashboard from "@/pages/AdminDashboard.jsx";
import AdminOrders from "@/pages/AdminOrders.jsx";
import AdminUsers from "@/pages/AdminUsers.jsx";
import Blog from "@/pages/Blog.jsx";
import BulkUpload from "@/pages/BulkUpload.jsx";
import Cart from "@/pages/Cart.jsx";
import ChangePass from "@/pages/ChangePass.jsx";
import Checkout from "@/pages/Checkout.jsx";
import CompareProducts from "@/pages/CompareProducts.jsx";
import Contact from "@/pages/Contact.jsx";
import Credits from "@/pages/Credits.jsx";
import EnterEmail from "@/pages/EnterEmail.jsx";
import ForgetPass from "@/pages/ForgetPass.jsx";
import Garage from "@/pages/Garage.jsx";
import Home from "@/pages/Home.jsx";
import Login from "@/pages/Login.jsx";
import MyOrders from "@/pages/MyOrders.jsx";
import OrderConfirmation from "@/pages/OrderConfirmation.jsx";
import ProductDetail from "@/pages/ProductDetail.jsx";
import ProductList from "@/pages/ProductList.jsx";
import RemoveProduct from "@/pages/RemoveProduct.jsx";
import Signup from "@/pages/Signup.jsx";
import UpdateProduct from "@/pages/UpdateProduct.jsx";
import UserProfile from "@/pages/UserProfile.jsx";
import ViewModel from "@/pages/ViewModel.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/enter-email" element={<EnterEmail />} />
      <Route path="/forgetpass" element={<ForgetPass />} />
      <Route path="/changepass" element={<ChangePass />} />
      <Route path="/home" element={<Home />} />

      <Route path="/productlist" element={<ProductList />} />
      <Route path="/productdetail/:id" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route
        path="/checkout"
        element={
          <PrivateRoute>
            <Checkout />
          </PrivateRoute>
        }
      />
      <Route
        path="/order-confirmation"
        element={
          <PrivateRoute>
            <OrderConfirmation />
          </PrivateRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <PrivateRoute>
            <MyOrders />
          </PrivateRoute>
        }
      />

      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/credits" element={<Credits />} />
      <Route path="/compare" element={<CompareProducts />} />

      <Route path="/viewmodel" element={<ViewModel />} />
      <Route path="/garage" element={<Garage />} />

      {/* Authenticated user routes */}
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <UserProfile />
          </PrivateRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/addproduct"
        element={
          <PrivateRoute requireRole="admin">
            <AddProduct />
          </PrivateRoute>
        }
      />
      <Route
        path="/updateproduct"
        element={
          <PrivateRoute requireRole="admin">
            <UpdateProduct />
          </PrivateRoute>
        }
      />
      <Route
        path="/removeproduct"
        element={
          <PrivateRoute requireRole="admin">
            <RemoveProduct />
          </PrivateRoute>
        }
      />
      <Route
        path="/admindashboard"
        element={
          <PrivateRoute requireRole="admin">
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <PrivateRoute requireRole="admin">
            <AdminOrders />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <PrivateRoute requireRole="admin">
            <AdminUsers />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/bulk-upload"
        element={
          <PrivateRoute requireRole="admin">
            <BulkUpload />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
