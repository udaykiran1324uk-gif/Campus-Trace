import React from 'react';

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

export const FeedSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
    {[1, 2, 3, 4, 5, 6].map(i => (
      <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <Skeleton className="h-48 w-full rounded-t-xl" />
        <div className="p-4 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-6 w-1/4" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-10 w-full mt-4" />
        </div>
      </div>
    ))}
  </div>
);

export const DetailSkeleton = () => (
  <div className="max-w-4xl mx-auto p-6 mt-10">
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
      <Skeleton className="md:w-1/2 h-64 md:h-[500px]" />
      <div className="md:w-1/2 p-8 space-y-6">
        <div className="flex justify-between items-start">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="pt-4 border-t border-gray-100">
          <Skeleton className="h-4 w-1/4 mb-4" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  </div>
);

export default Skeleton;
