export default function RefundPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-heading font-bold text-gray-900 mb-8">Refund & Return Policy</h1>

      <div className="prose prose-lg max-w-none space-y-8">
        <section>
          <p className="text-lg text-gray-700">
            At Bale, we want you to be completely satisfied with your purchase. If you're not happy with your order, we're here to help.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Return & Refund Eligibility</h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <p className="text-lg font-semibold text-gray-900 mb-2">
              7-Day Return Window
            </p>
            <p className="text-gray-700">
              You have <strong>7 calendar days</strong> from the date of delivery to return an item and request a refund.
            </p>
          </div>

          <p className="mb-4">To be eligible for a return and refund, your item must meet the following conditions:</p>

          <ul className="space-y-3 list-disc list-inside text-gray-700">
            <li>The product must be in its original, unopened packaging with all seals intact</li>
            <li>The game box and all contents must be unused and in the same condition as received</li>
            <li>All original packaging materials, including shrink wrap, must be intact</li>
            <li>The product must not show any signs of use, damage, or tampering</li>
            <li>You must provide proof of purchase (order number or receipt)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Non-Returnable Items</h2>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="font-semibold text-gray-900 mb-3">The following items cannot be returned or refunded:</p>
            <ul className="space-y-2 list-disc list-inside text-gray-700">
              <li>Products with opened or damaged packaging</li>
              <li>Products showing signs of use or play</li>
              <li>Products with missing components or cards</li>
              <li>Products damaged due to misuse or neglect</li>
              <li>Products returned after 7 days from delivery date</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">How to Initiate a Return</h2>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
                <div>
                  <strong>Contact Us Within 7 Days:</strong> Email us at <a href="mailto:orders@shop.baleapp.in" className="text-primary hover:underline">orders@shop.baleapp.in</a> or call <a href="tel:9619915299" className="text-primary hover:underline">9619915299</a> with your order number and reason for return.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
                <div>
                  <strong>Get Return Authorization:</strong> Our team will review your request and provide you with a Return Authorization (RA) number if approved.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
                <div>
                  <strong>Pack the Product:</strong> Securely pack the product in its original packaging with the RA number clearly marked on the outside.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">4</span>
                <div>
                  <strong>Ship the Return:</strong> Send the package to the address provided by our customer service team. You are responsible for return shipping costs unless the product is defective or we made an error.
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Refund Process</h2>

          <p className="mb-4">Once we receive and inspect your returned item:</p>

          <ul className="space-y-3 list-disc list-inside text-gray-700 mb-6">
            <li>We will notify you via email about the approval or rejection of your refund</li>
            <li>If approved, your refund will be processed within <strong>5-7 business days</strong></li>
            <li>The refund will be credited to your original payment method</li>
            <li>Depending on your bank or payment provider, it may take an additional 3-5 business days for the refund to reflect in your account</li>
          </ul>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="font-semibold text-gray-900 mb-2">⚠️ Important Note:</p>
            <p className="text-gray-700">
              Shipping charges (if any were applicable) are non-refundable. You will be responsible for paying your own shipping costs for returning the item unless the product is defective or we shipped the wrong item.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Damaged or Defective Products</h2>

          <p className="mb-4">
            If you receive a damaged, defective, or incorrect product, please contact us immediately:
          </p>

          <ul className="space-y-3 list-disc list-inside text-gray-700 mb-6">
            <li>Contact us within <strong>48 hours of delivery</strong></li>
            <li>Provide photos of the damaged/defective product and packaging</li>
            <li>Include your order number and description of the issue</li>
          </ul>

          <p className="text-gray-700 mb-4">
            For damaged or defective products, we will:
          </p>

          <ul className="space-y-3 list-disc list-inside text-gray-700">
            <li>Arrange for a free replacement at no additional cost, OR</li>
            <li>Issue a full refund including original shipping charges</li>
            <li>Provide a prepaid return label if return is required</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Exchanges</h2>

          <p className="text-gray-700">
            We currently do not offer direct exchanges. If you wish to exchange an item, please return the original product following our return process and place a new order for the desired item.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Late or Missing Refunds</h2>

          <p className="mb-4">If you haven't received a refund within the expected timeframe:</p>

          <ol className="space-y-3 list-decimal list-inside text-gray-700">
            <li>Check your bank account or credit card statement again</li>
            <li>Contact your bank or credit card company - it may take some time before your refund is officially posted</li>
            <li>Contact your payment provider (PhonePe, bank, etc.) as processing times may vary</li>
            <li>If you've done all of this and still haven't received your refund, please contact us at <a href="mailto:orders@shop.baleapp.in" className="text-primary hover:underline">orders@shop.baleapp.in</a></li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Cancellations</h2>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <p className="mb-4"><strong>Order Cancellation Before Shipment:</strong></p>
            <p className="text-gray-700 mb-4">
              You may cancel your order before it has been shipped. Contact us immediately at <a href="tel:9619915299" className="text-primary hover:underline">9619915299</a> or <a href="mailto:orders@shop.baleapp.in" className="text-primary hover:underline">orders@shop.baleapp.in</a> with your order number. If the order hasn't been processed yet, we will cancel it and issue a full refund.
            </p>

            <p className="mb-2"><strong>Order Cancellation After Shipment:</strong></p>
            <p className="text-gray-700">
              Once the order has been shipped, cancellation is not possible. You will need to follow our standard return process once you receive the product.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Refund for Payment Failures</h2>

          <p className="text-gray-700">
            In case of payment failures where money has been deducted from your account but the order was not confirmed, the amount will be automatically refunded to your original payment method within 5-7 business days. If you don't receive the refund within this timeframe, please contact us with your transaction details.
          </p>
        </section>

        <section className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Questions About Returns?</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions about our refund and return policy, please don't hesitate to contact us:
          </p>
          <ul className="space-y-2">
            <li><strong>Email:</strong> <a href="mailto:orders@shop.baleapp.in" className="text-primary hover:underline">orders@shop.baleapp.in</a></li>
            <li><strong>Phone:</strong> <a href="tel:9619915299" className="text-primary hover:underline">9619915299</a></li>
            <li><strong>Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM IST</li>
            <li><strong>Address:</strong> B48, KALPANA, Shree Mahalakshmi CHS, Veera Desai Road, Andheri W, Mumbai 400058</li>
          </ul>
        </section>

        <section className="bg-green-50 p-6 rounded-lg border border-green-200">
          <p className="text-sm text-gray-700">
            <strong>Last Updated:</strong> January 2026<br />
            This policy is subject to change without notice. Please review this page periodically for updates.
          </p>
        </section>
      </div>
    </div>
  );
}
