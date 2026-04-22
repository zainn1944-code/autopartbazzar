export default function CustomerProductsSection({ products }) {
    return (
      <div className="bg-[#0a0a0a]">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-300">
            Customers also purchased
          </h1>
  
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {products.map((product) => (
              <div key={product.id} className="group relative">
                <img
                  alt={product.name}
                  src={product.image}
                  className="aspect-square w-full rounded-md bg-gray-200 object-cover group-hover:opacity-75 lg:aspect-auto lg:h-80"
                />
                <div className="mt-4 flex justify-between">
                  <div>
                    <h3 className="text-sm text-red-500">
                      <a href={product.href}>
                        <span aria-hidden="true" className="absolute inset-0" />
                        {product.name}
                      </a>
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-300">Rs {product.price}</p>
                </div>
  
                <div className="mt-4">
                  <button
                    onClick={() => {
                      console.log('Item added to cart'); // Replace with your actual add to cart logic
                    }}
                    className="w-full bg-red-500 text-white py-2 px-4 rounded-md 
                              hover:bg-red-600 hover:scale-105 hover:cursor-pointer 
                              transition-transform duration-300 ease-in-out 
                              focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  