import AdminSkeletonShell, { Bone } from '@/components/admin/AdminSkeletonShell'

export default function Loading() {
  return (
    <AdminSkeletonShell>
      <div className="flex flex-col gap-8">
        <Bone className="h-8 w-28" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Bone key={i} className="h-24" />)}
        </div>
        <div className="flex flex-col gap-2">
          {[...Array(6)].map((_, i) => <Bone key={i} className="h-12" />)}
        </div>
      </div>
    </AdminSkeletonShell>
  )
}
