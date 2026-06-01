import OrderForm from '@/components/form/OrderForm'

export default function Commander() {
  return (
    <section id="commander" className="relative bg-[#ede8df] border-t-2 border-[#043672]/10 overflow-hidden">
      {/* Halos décoratifs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[radial-gradient(circle,rgba(184,150,90,0.07)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 -left-32 w-[420px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(4,54,114,0.04)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative max-w-[880px] mx-auto px-6 md:px-10 py-16 md:py-24">
        {/* Carte formulaire — surface crème surélevée */}
        <div className="bg-[#faf7f2] border border-[#043672]/08 shadow-[0_32px_80px_rgba(4,54,114,0.08)] px-7 md:px-14 py-12 md:py-16">
          <OrderForm />
        </div>
      </div>
    </section>
  )
}
