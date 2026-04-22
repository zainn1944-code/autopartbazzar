import { Navigate, Route, Routes } from "react-router-dom";
import PrivateRoute from "@/routes/PrivateRoute.jsx";

import About from "@/pages/About.jsx";
import AddProduct from "@/pages/AddProduct.jsx";
import AdminDashboard from "@/pages/AdminDashboard.jsx";
import Blog from "@/pages/Blog.jsx";
import Cart from "@/pages/Cart.jsx";
import ChangePass from "@/pages/ChangePass.jsx";
import Checkout from "@/pages/Checkout.jsx";
import Contact from "@/pages/Contact.jsx";
import EnterEmail from "@/pages/EnterEmail.jsx";
import ForgetPass from "@/pages/ForgetPass.jsx";
import Garage from "@/pages/Garage.jsx";
import Garage1 from "@/pages/Garage1.jsx";
import Home from "@/pages/Home.jsx";
import Login from "@/pages/Login.jsx";
import OrderConfirmation from "@/pages/OrderConfirmation.jsx";
import ProductDetail from "@/pages/ProductDetail.jsx";
import ProductList from "@/pages/ProductList.jsx";
import RemoveProduct from "@/pages/RemoveProduct.jsx";
import Signup from "@/pages/Signup.jsx";
import UpdateProduct from "@/pages/UpdateProduct.jsx";
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

      <Route
        path="/home"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />

      <Route path="/productlist" element={<ProductList />} />
      <Route path="/productdetail/:id" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/order-confirmation" element={<OrderConfirmation />} />

      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/blog" element={<Blog />} />

      <Route path="/viewmodel" element={<ViewModel />} />
      <Route path="/garage" element={<Garage />} />
      <Route path="/garage1" element={<Garage1 />} />

      <Route path="/addproduct" element={<AddProduct />} />
      <Route path="/updateproduct" element={<UpdateProduct />} />
      <Route path="/removeproduct" element={<RemoveProduct />} />
      <Route path="/admindashboard" element={<AdminDashboard />} />
    </Routes>
  );
}
