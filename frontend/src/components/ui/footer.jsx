import React from "react";
import { FaFacebookF, FaInstagram, FaGithub, FaYoutube } from "react-icons/fa";

function Footer() {
  return (
    <footer className="bg-black py-6 text-gray-400">
      <div className="container mx-auto flex flex-col items-center">
        <div className="mb-4 flex flex-row gap-8">
          <a href="/about" className="hover:bg-red-500">
            About
          </a>
          <a href="/blog" className="hover:bg-red-500">
            Blog
          </a>
          <a href="/productlist" className="hover:bg-red-500">
            Products
          </a>
          <a href="/contact" className="hover:bg-red-500">
            Contact Us
          </a>
          <a href="/credits" className="hover:bg-red-500">
            Credits
          </a>
          <a href="/about" className="hover:bg-red-500">
            Partners
          </a>
        </div>
        <div className="mb-2 flex flex-row gap-8">
          <a href="#" className="hover:text-gray-300">
            <FaFacebookF className="h-6 w-6" />
          </a>
          <a href="#" className="hover:text-gray-300">
            <FaInstagram className="h-6 w-6" />
          </a>
          <a href="https://github.com/abubakarO1/AutoPartBazaar" className="hover:text-gray-300">
            <FaGithub className="h-6 w-6" />
          </a>
          <a href="#" className="hover:text-gray-300">
            <FaYoutube className="h-6 w-6" />
          </a>
        </div>
        <div className="mt-4 text-sm">© 2024 AutoPartBazaar, Inc. All rights reserved.</div>
      </div>
    </footer>
  );
}

export default Footer;
