import AdminSkeletonShell, { Bone } from '@/components/admin/AdminSkeletonShell'

export default function Loading() {
  return (
    <AdminSkeletonShell>
      <div className="flex flex-col gap-6">
        <Bone className="h-8 w-36" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Bone className="aspect-square w-full" />
              <Bone className="h-4 w-3/4" />
              <Bone className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </AdminSkeletonShell>
  )
}
