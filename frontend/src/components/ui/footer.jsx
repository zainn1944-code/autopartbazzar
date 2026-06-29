import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaGithub, FaYoutube, FaPaperPlane } from "react-icons/fa";

const QUICK_LINKS = [
  { label: "About Us", to: "/about" },
  { label: "Blog", to: "/blog" },
  { label: "Products", to: "/productlist" },
  { label: "Contact Us", to: "/contact" },
  { label: "3D Garage", to: "/garage" },
];

const CUSTOMER_SERVICE = [
  { label: "My Orders", to: "/orders" },
  { label: "Shipping & Delivery", to: "/about" },
  { label: "Returns & Refunds", to: "/about" },
  { label: "FAQs", to: "/about" },
  { label: "Support", to: "/contact" },
];

const LEGAL = [
  { label: "Terms & Conditions", to: "/about" },
  { label: "Privacy Policy", to: "/about" },
  { label: "Refund Policy", to: "/about" },
];

function LinkColumn({ title, links }) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">{title}</h4>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-sm text-gray-400 transition-colors hover:text-red-500">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="border-t border-white/10 bg-[#050505] text-gray-400">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <div className="mb-4 flex items-center gap-2">
              <img src="/Images/Logo.png" alt="AutoPartBazaar" className="h-8 w-auto" />
              <span className="text-xl font-bold text-white">
                Auto<span className="text-red-500">Part</span>Bazaar
              </span>
            </div>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-gray-400">
              Your ultimate marketplace for premium auto parts, accessories, and 3D customization.
            </p>
            <div className="flex gap-3">
              {[
                { icon: FaFacebookF, href: "#" },
                { icon: FaInstagram, href: "#" },
                { icon: FaGithub, href: "https://github.com/abubakarO1/AutoPartBazaar" },
                { icon: FaYoutube, href: "#" },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition-all hover:border-red-500/50 hover:bg-red-600/20 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-2">
            <LinkColumn title="Quick Links" links={QUICK_LINKS} />
          </div>
          <div className="lg:col-span-2">
            <LinkColumn title="Customer Service" links={CUSTOMER_SERVICE} />
          </div>
          <div className="lg:col-span-1">
            <LinkColumn title="Legal" links={LEGAL} />
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-3">
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Newsletter</h4>
            <p className="mb-4 text-sm leading-relaxed text-gray-400">
              Subscribe to get updates on new products and offers.
            </p>
            {subscribed ? (
              <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                Thanks for subscribing! 🎉
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex items-center gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-full border border-white/15 bg-transparent px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-transform hover:scale-105"
                >
                  <FaPaperPlane className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center">
          <p className="text-sm text-gray-500">© 2026 Auto Part Bazaar, Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
