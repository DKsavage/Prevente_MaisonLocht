import AdminSkeletonShell, { Bone } from '@/components/admin/AdminSkeletonShell'

export default function Loading() {
  return (
    <AdminSkeletonShell>
      <div className="flex flex-col gap-6">
        <Bone className="h-8 w-40" />
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => <Bone key={i} className="h-9 w-24" />)}
        </div>
        <div className="flex flex-col gap-2">
          <Bone className="h-10" />
          {[...Array(8)].map((_, i) => <Bone key={i} className="h-16" />)}
        </div>
      </div>
    </AdminSkeletonShell>
  )
}
