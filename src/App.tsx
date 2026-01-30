import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Knowledge from "./pages/Knowledge";
import CultivarDetail from "./pages/CultivarDetail";
import Market from "./pages/Market";
import Dashboard from "./pages/Dashboard";
import ProductDetail from "./pages/ProductDetail";
import UpdateProfile from "./pages/UpdateProfile";
import FarmDashboard from "./pages/farm/FarmDashboard";
import AddProduct from "./pages/farm/AddProduct";
import ManageProducts from "./pages/farm/ManageProducts";
import FarmOrders from "./pages/farm/FarmOrders";
import OrderDetail from "./pages/farm/OrderDetail";
import NotFound from "./pages/NotFound";
import UserOrders from "./pages/UserOrders";



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth/login" element={<Auth />} />
          <Route path="/knowledge" element={<Knowledge />} />
          <Route path="/knowledge/:slug" element={<CultivarDetail />} />
          <Route path="/market" element={<Market />} />
          <Route path="/market/product/:id" element={<ProductDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<UpdateProfile />} />
          {/* Farm routes */}
          <Route path="/farm/products" element={<ManageProducts />} />
          <Route path="/farm/products/add" element={<AddProduct />} />
          <Route path="/farm/orders" element={<FarmOrders />} />
          <Route path="/farm/orders/:id" element={<OrderDetail />} />
          <Route path="/farm/dashboard" element={<FarmDashboard />} />
          
          <Route path="/market" element={<Market />} />
          <Route path="/market/product/:id" element={<ProductDetail />} />
          <Route path="/dashboard/orders" element={<UserOrders />} />




          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
