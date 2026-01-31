import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_COUNT = 6;

function SavedItemsSkeleton() {
  return (
    <div className="grid gap-4" data-testid="saved-items-skeleton">
      {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <Card key={`saved-item-skeleton-${index}`}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-3/4" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Skeleton className="h-3 w-24" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export { SavedItemsSkeleton };
