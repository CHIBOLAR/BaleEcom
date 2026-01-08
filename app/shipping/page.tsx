export default function ShippingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-heading font-bold text-gray-900 mb-8">Shipping Policy</h1>

      <div className="prose prose-lg max-w-none space-y-6">
        <div className="bg-green-50 border-l-4 border-secondary p-6 mb-8">
          <p className="text-xl font-semibold text-gray-900 mb-2">
            🎉 FREE Shipping on All Orders!
          </p>
          <p className="text-gray-700">
            We're excited to offer <strong>FREE shipping</strong> on all orders across India. No minimum order value required!
          </p>
        </div>

        <section>
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Shipping Information</h2>

          <p>
            The orders for the user are shipped through registered domestic courier companies and/or speed post only. Orders are shipped within <strong>7 days</strong> from the date of the order and/or payment or as per the delivery date agreed at the time of order confirmation and delivering of the shipment, subject to courier company/post office norms.
          </p>

          <p>
            Platform Owner shall not be liable for any delay in delivery by the courier company/postal authority.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Delivery Details</h2>

          <ul className="space-y-3 list-disc list-inside">
            <li>
              <strong>Delivery Address:</strong> All orders will be delivered to the address provided by the buyer at the time of purchase.
            </li>
            <li>
              <strong>Order Confirmation:</strong> Delivery of our services will be confirmed on your email ID as specified at the time of registration.
            </li>
            <li>
              <strong>Shipping Costs:</strong> There are NO shipping costs! We offer FREE shipping on all orders across India.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Processing Timeline</h2>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">1</span>
                <div>
                  <strong>Order Placed:</strong> You'll receive an order confirmation email immediately after purchase.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">2</span>
                <div>
                  <strong>Processing (1-2 days):</strong> Your order is being prepared for shipment.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">3</span>
                <div>
                  <strong>Shipped (Within 7 days):</strong> You'll receive tracking information via email once your order is dispatched.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">4</span>
                <div>
                  <strong>Delivered (3-7 business days):</strong> Your order arrives at your doorstep!
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Important Notes</h2>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <ul className="space-y-2 list-disc list-inside text-gray-700">
              <li>Delivery timelines are subject to courier company/post office norms</li>
              <li>Platform Owner is not liable for delays by courier companies or postal authorities</li>
              <li>Please ensure your delivery address is accurate and complete</li>
              <li>Someone should be available to receive the package at the delivery address</li>
            </ul>
          </div>
        </section>

        <section className="bg-blue-50 p-6 rounded-lg border border-blue-200 mt-8">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Need Help?</h2>
          <p>
            If you have any questions about shipping or your order, please contact us:
          </p>
          <ul className="mt-3 space-y-1">
            <li><strong>Email:</strong> orders@shop.baleapp.in</li>
            <li><strong>Phone:</strong> 9619915299</li>
            <li><strong>Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM IST</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
