import OrderForm from '@/components/form/OrderForm'

export default function Commander() {
  return (
    <section id="commander" className="bg-[#faf7f2] border-t-2 border-[#043672]/10">
      <div className="max-w-[860px] mx-auto px-8 md:px-14 py-16 md:py-24">
        <OrderForm />
      </div>
    </section>
  )
}
