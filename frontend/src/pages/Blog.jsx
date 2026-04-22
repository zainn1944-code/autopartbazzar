import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";

export default function Blog() {
  return (
    <>
      <Navbar />
      <div className="max-w-screen-xl mx-auto p-5 sm:p-8 md:p-12 relative bg-#2A2A2A">
        <div
          className="bg-cover h-64 text-center overflow-hidden"
          style={{
            height: "450px",
            backgroundImage:
              "url('/Images/latest.jpg')", // Replace with a relevant image for AutoPartBazaar
          }}
        ></div>
        <div className="max-w-2xl mx-auto">
          <div className="mt-3 bg-#1A1A1A rounded-b lg:rounded-b-none lg:rounded-r flex flex-col justify-between leading-normal">
            <div className="">
              <a
                href="#"
                className="text-xs text-red-600 uppercase font-medium hover:text-white transition duration-500 ease-in-out"
              >
                AutoParts
              </a>
              ,
              <a
                href="#"
                className="text-xs text-red-600 uppercase font-medium hover:text-white transition duration-500 ease-in-out"
              >
                E-commerce
              </a>
              <h1 href="#" className="text-white font-bold text-3xl mb-2">
                Welcome to AutoPartBazaar: Revolutionizing Auto Part Shopping
              </h1>
              <p className="text-gray-400 text-xs mt-2">
                Written By:
                <a
                  href="#"
                  className="text-red-600 font-medium hover:text-white transition duration-500 ease-in-out"
                >
                  Sadia Qasmi
                </a>
              </p>

              <p className="text-base leading-8 my-5 text-gray-400">
                AutoPartBazaar is your one-stop solution for high-quality auto parts. We provide everything from engine oils
                to air filters, allowing you to shop for essential car components with ease. Our platform brings together
                a wide range of automotive products, offering competitive prices, secure payment options, and fast delivery.
                Whether you're a professional mechanic or a car enthusiast, AutoPartBazaar is here to meet all your needs.
              </p>

              <h3 className="text-2xl font-bold my-5 text-white">#1. The Vision Behind AutoPartBazaar</h3>

              <p className="text-base leading-8 my-5 text-gray-400">
                At AutoPartBazaar, our goal is to make the shopping experience for auto parts more accessible, transparent,
                and reliable. We're committed to ensuring that car owners and mechanics can quickly find the parts they need
                to keep vehicles running smoothly. We carefully curate our selection of auto parts to guarantee that
                everything we offer is of the highest quality.
              </p>

              <blockquote className="border-l-4 text-base italic leading-8 my-5 p-5 text-red-600">
                "Your go-to marketplace for reliable, high-quality auto parts."
              </blockquote>

              <p className="text-base leading-8 my-5 text-gray-400">
                From the latest car parts to essential maintenance products, AutoPartBazaar has got you covered. Whether
                you're looking to upgrade your vehicle or simply replace a worn-out component, we strive to provide the
                best options to meet your needs. With a user-friendly platform, we make it easy for you to find exactly
                what you need in just a few clicks.
              </p>

              <h3 className="text-2xl font-bold my-5 text-white">#2. Why Choose AutoPartBazaar?</h3>

              <p className="text-base leading-8 my-5 text-gray-400">
                One of the major benefits of shopping with AutoPartBazaar is our commitment to providing top-notch customer service. 
                Our team is always ready to assist you in finding the right parts for your car, whether it’s for routine maintenance 
                or for an unexpected repair. We understand how crucial your vehicle is to you, which is why we make sure all our 
                products are tested for quality and performance.
              </p>

              <h3 className="text-2xl font-bold my-5 text-white">#3. Our Wide Range of Products</h3>

              <p className="text-base leading-8 my-5 text-gray-400">
                AutoPartBazaar offers an extensive catalog of auto parts ranging from everyday essentials like filters and fluids 
                to specialized items such as engine components and performance upgrades. Whether you drive a sedan, SUV, or sports 
                car, you’ll find the parts that match your vehicle specifications.
              </p>

              <p className="text-base leading-8 my-5 text-gray-400">
                As part of our mission to make car repairs more convenient, we also provide easy-to-follow guides and tutorials to 
                help you install the parts you purchase. With our customer-focused approach, we aim to save you time and money 
                while helping you keep your car in optimal condition.
              </p>

              <h3 className="text-2xl font-bold my-5 text-white">#4. How AutoPartBazaar Is Changing the Industry</h3>

              <p className="text-base leading-8 my-5 text-gray-400">
                The automotive industry has traditionally been slow to adapt to digital transformation, but AutoPartBazaar is changing 
                that. By offering a seamless online shopping experience, transparent pricing, and detailed product information, we 
                have made it easier than ever for car owners and mechanics to find quality parts and get them delivered right to their 
                doorstep. Our fast and reliable shipping options ensure that you get the parts you need when you need them.
              </p>

              <blockquote className="border-l-4 text-base italic leading-8 my-5 p-5 text-red-600">
                "Transforming the way people buy auto parts, one click at a time."
              </blockquote>

              <p className="text-base leading-8 my-5 text-gray-400">
                The future of auto part shopping is here, and it’s all about convenience, reliability, and quality. Join us at 
                AutoPartBazaar and experience the next level of automotive shopping today.
              </p>

              <a
                href="#"
                className="text-xs text-red-600 font-medium hover:text-white transition duration-500 ease-in-out"
              >
                #AutoParts
              </a>
              ,
              <a
                href="#"
                className="text-xs text-red-600 font-medium hover:text-white transition duration-500 ease-in-out"
              >
                #CarMaintenance
              </a>
              ,
              <a
                href="#"
                className="text-xs text-red-600 font-medium hover:text-white transition duration-500 ease-in-out"
              >
                #Automotive
              </a>
              ,
              <a
                href="#"
                className="text-xs text-red-600 font-medium hover:text-white transition duration-500 ease-in-out"
              >
                #CarParts
              </a>
              ,
              <a
                href="#"
                className="text-xs text-red-600 font-medium hover:text-white transition duration-500 ease-in-out"
              >
                #AutoPartBazaar
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
