import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/ui/navbar";
import Footer from "@/components/ui/footer";
import { Parallax } from "react-parallax";
import { FaStar, FaRegStar } from "react-icons/fa";

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-screen bg-black">
        <video
          className="absolute top-0 left-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/videos/Car.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="relative z-10 flex items-center justify-center h-full text-center text-white px-4 md:px-8">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
              Welcome to AutoPartBazaar
            </h1>
            <p className="text-lg sm:text-xl">
              The best place for car parts and accessories. Customize your ride
              today.
            </p>
            <div className="flex justify-center">
              <a
                href="#features"
                className="mt-6 inline-block px-6 py-3 bg-red-600 text-white font-semibold text-lg rounded-md hover:bg-gray-500 transition duration-300"
              >
                Shop Now
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-black">
  <section
    id="features"
    className="relative block px-6 py-10 md:py-20 md:px-10 border-t border-b border-neutral-900 bg-neutral-900/30"
  >
    <div className="relative mx-auto max-w-5xl text-center">
      <span className="text-gray-400 my-3 flex items-center justify-center font-medium uppercase tracking-wider">
        Why Choose AutoPartBazaar
      </span>
      <h2 className="block w-full bg-gradient-to-b from-white to-gray-400 bg-clip-text font-bold text-transparent text-3xl sm:text-4xl">
        Build the Perfect Ride with AutoPartBazaar
      </h2>
      <p className="mx-auto my-4 w-full max-w-xl text-center font-medium leading-relaxed tracking-wide text-gray-400">
        AutoPartBazaar offers a seamless way to customize your car. From finding the perfect exterior parts to visualizing them in 3D, our platform makes it easy to create a car that fits your style and needs.
      </p>
    </div>

    <div className="relative mx-auto max-w-7xl z-10 grid grid-cols-1 gap-10 pt-14 sm:grid-cols-2 lg:grid-cols-3">
      {/* Feature 1 */}
      <div className="rounded-md border border-neutral-800 bg-neutral-900/50 p-8 text-center shadow">
        <div
          className="button-text mx-auto flex h-12 w-12 items-center justify-center rounded-md border"
          style={{
            backgroundImage:
              "linear-gradient(rgb(220, 38, 38) 0%, rgb(153, 27, 27) 100%)",
            borderColor: "rgb(185, 28, 28)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="icon icon-tabler icon-tabler-car"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M4 13v-5h16v5l3 5h-22l3 -5z"></path>
            <path d="M5 17l1 -1h12l1 1"></path>
            <path d="M7 9v-3a3 3 0 0 1 6 0v3"></path>
            <path d="M17 9v-3a3 3 0 0 0 -6 0v3"></path>
          </svg>
        </div>
        <h3 className="mt-6 text-gray-400">Customizable Parts</h3>
        <p className="my-4 font-normal leading-relaxed tracking-wide text-gray-200">
          From bumpers to spoilers, customize your car with a wide variety of exterior parts, all tailored to your car’s make and model.
        </p>
      </div>

      {/* Feature 2 */}
      <div className="rounded-md border border-neutral-800 bg-neutral-900/50 p-8 text-center shadow">
        <div
          className="button-text mx-auto flex h-12 w-12 items-center justify-center rounded-md border"
          style={{
            backgroundImage:
              "linear-gradient(rgb(220, 38, 38) 0%, rgb(153, 27, 27) 100%)",
            borderColor: "rgb(185, 28, 28)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="icon icon-tabler icon-tabler-tachometer"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M12 3v18a9 9 0 1 0 9 -9h-9"></path>
            <path d="M12 6a6 6 0 1 1 -6 6h6"></path>
            <path d="M15 9l2 2"></path>
          </svg>
        </div>
        <h3 className="mt-6 text-gray-400">Fast Delivery</h3>
        <p className="my-4 font-normal leading-relaxed tracking-wide text-gray-200">
          Get the parts you need quickly and efficiently, with fast shipping to ensure you never have to wait too long to enhance your ride.
        </p>
      </div>

      {/* Feature 3 */}
      <div className="rounded-md border border-neutral-800 bg-neutral-900/50 p-8 text-center shadow">
        <div
          className="button-text mx-auto flex h-12 w-12 items-center justify-center rounded-md border"
          style={{
            backgroundImage:
              "linear-gradient(rgb(220, 38, 38) 0%, rgb(153, 27, 27) 100%)",
            borderColor: "rgb(185, 28, 28)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="icon icon-tabler icon-tabler-tools"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
            <path d="M3 21h4l13 -13a1.5 1.5 0 0 0 -4 -4l-13 13v4"></path>
            <line x1="14.5" y1="5.5" x2="18.5" y2="9.5"></line>
            <polyline points="12 8 7 3 3 7 8 12"></polyline>
            <line x1="7" y1="8" x2="5.5" y2="9.5"></line>
            <polyline points="16 12 21 17 17 21 12 16"></polyline>
            <line x1="16" y1="17" x2="14.5" y2="18.5"></line>
          </svg>
        </div>
        <h3 className="mt-6 text-gray-400">Everything You Need</h3>
        <p className="my-4 font-normal leading-relaxed tracking-wide text-gray-200">
          AutoPartBazaar provides all the tools you need to visualize, select, and order car parts without the hassle. Find everything in one place.
        </p>
      </div>
    </div>
  </section>
</div>

      {/* Parallax Image Section */}
      <section>
        <Parallax
          className="parallax-container"
          bgImage="/Images/car1.jpg"
          strength={300}
        >
          <div
            className="h-[650px] bg-black bg-opacity-60"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <h1 className="text-white text-5xl">Unleash Your Creativity</h1>
          </div>
        </Parallax>
      </section>

{/* Here is the section for visualizer */}
<section className="bg-black text-white py-16 relative">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center md:items-start md:flex-row">
        {/* Text Content */}
        <div className="md:w-1/2 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight cursor-pointer hover:underline">
           AUTO PART BAZAAR VISUALIZER
        </h1>
          <div className="h-1 w-24 bg-red-600 my-4 mx-auto md:mx-0"></div>
          <p className="text-lg text-gray-300 mb-6">
            AutoPartBazaar's Configurator allows you to visualize your car
            with numerous parts and save them.
          </p>
          <Link to="/viewmodel">
          <button className="bg-red-600 text-white text-lg font-bold px-6 py-3 rounded hover:bg-gray-700 transition-all">
           VISUALIZER
          </button>
          </Link>
        </div>

        {/* Images */}
        <div className="md:w-1/2 flex items-center justify-center relative mt-8 md:mt-0">
          {/* Truck Image */}
          <div className="absolute top-0 right-8">
            <img
              src="/Images/truck.png"
              alt="Truck"
              width={500}
              height={300}
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </section>


       {/* Shopping Guide Section */}
       <section id="shopping-guide" className="bg-black text-white py-24 px-4 min-h-screen">
  <div className="max-w-7xl mx-auto text-center">
    <h2 className="text-4xl font-bold text-red-600 mb-6">
      Your Shopping Guide
    </h2>
    <p className="text-lg mb-12">
      Follow these simple steps to find and customize your perfect car parts!
    </p>

    <div className="grid md:grid-cols-3 gap-12">
      {/* Step 1 */}
      <div className="bg-black border-2 border-gray-600 p-10 rounded-lg shadow-xl">
        <div className="text-red-600 text-5xl mb-6">1</div>
        <h3 className="text-3xl font-semibold mb-4">Browse Categories</h3>
        <p className="text-gray-400">
          Start by browsing through our categories to find the right car parts.
        </p>
      </div>

      {/* Step 2 */}
      <div className="bg-black border-2 border-gray-600 p-10 rounded-lg shadow-xl">
        <div className="text-red-600 text-5xl mb-6">2</div>
        <h3 className="text-3xl font-semibold mb-4">Customize Your Parts</h3>
        <p className="text-gray-400">
          Use our 3D visualization tool to customize your car parts before purchasing.
        </p>
      </div>

      {/* Step 3 */}
      <div className="bg-black border-2 border-gray-600 p-10 rounded-lg shadow-xl">
        <div className="text-red-600 text-5xl mb-6">3</div>
        <h3 className="text-3xl font-semibold mb-4">Checkout and Pay</h3>
        <p className="text-gray-400">
          Add your customized parts to the cart, and proceed with a secure checkout.
        </p>
      </div>
    </div>

    <div className="mt-12">
      <Link
        to="/productlist"
        className="text-lg text-red-600 hover:underline font-semibold"
      >
        Start Shopping Now &rarr;
      </Link>
    </div>
  </div>
</section>



      {/* Here is the code for Reviews */}

<section className="py-24 relative bg-black text-white">
      <div className="w-full max-w-7xl px-4 md:px-5 lg:px-6 mx-auto">
        <h2 className="font-bold text-3xl sm:text-4xl leading-10 text-white mb-12 text-center">
          Customer Reviews & Ratings
        </h2>
        <div className="grid grid-cols-12 gap-8 mb-11">
          {/* Rating Summary */}
          <div className="col-span-12 xl:col-span-4 flex items-center">
            <div className="flex flex-col gap-y-6 w-full max-w-3xl mx-auto">
              {[5, 4, 3, 2, 1].map((rating, index) => {
                const percentage = rating * 20; // Dynamic percentage for bar fill
                return (
                  <div key={index} className="flex items-center w-full">
                    {/* Rating Number */}
                    <p className="font-medium text-lg py-[1px] text-white mr-3">{rating}</p>
                    {/* Stars */}
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) =>
                        i < rating ? (
                          <FaStar key={i} className="text-yellow-300 h-5 w-5" />
                        ) : (
                          <FaRegStar key={i} className="text-gray-600 h-5 w-5" />
                        )
                      )}
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 flex-1 rounded-full bg-gray-600 ml-5 relative">
                      <div
                        className="h-full rounded-full bg-yellow-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    {/* Rating Count */}
                    <p className="font-medium text-lg py-[1px] text-white ml-3">{rating * 10}</p>
                  </div>
                );
              })}
            </div>
          </div>
          {/* End Rating Summary */}

          {/* Review Details */}
          <div className="col-span-12 xl:col-span-8">
            <div className="grid grid-cols-12 h-full px-8 py-8 rounded-3xl bg-gray-800 ">
              <div className="col-span-12 md:col-span-8 flex flex-col items-center">
                <h2 className="font-bold text-6xl text-white text-center mb-4">4.3</h2>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) =>
                    i < 4 ? (
                      <FaStar key={i} className="text-yellow-300 h-6 w-6" />
                    ) : (
                      <FaRegStar key={i} className="text-gray-700 h-6 w-6" />
                    )
                  )}
                </div>
                <p className="font-normal text-lg text-gray">100+ Ratings</p>
              </div>
              <div className="col-span-12 md:col-span-4 flex flex-col items-center">
                <button className="w-full rounded-full px-6 py-4 bg-red-600 text-white text-lg font-semibold mb-4 hover:bg-red-700 transition-all">
                  Write A Review
                </button>
                <button className="w-full rounded-full px-6 py-4 bg-white text-red-600 text-lg font-semibold border border-red-600 hover:bg-gray-800 transition-all">
                  See All Reviews
                </button>
              </div>
            </div>
          </div>
          {/* End Review Details */}
        </div>
      </div>
    </section>

      <Footer />
    </>
  );
}
