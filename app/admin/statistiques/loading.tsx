import AdminSkeletonShell, { Bone } from '@/components/admin/AdminSkeletonShell'

export default function Loading() {
  return (
    <AdminSkeletonShell>
      <div className="flex flex-col gap-9">
        <Bone className="h-8 w-40" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Bone key={i} className="h-24" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <Bone className="h-52" />
          <Bone className="h-52" />
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <Bone className="h-48" />
          <Bone className="h-48" />
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <Bone className="h-40" />
          <Bone className="h-40" />
        </div>
      </div>
    </AdminSkeletonShell>
  )
}
