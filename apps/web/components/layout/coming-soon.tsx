export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-1 p-7">
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">
        Not built yet — Customers is the first full vertical slice (list/detail/create/delete). The rest of the
        modules follow the same pattern next.
      </p>
    </div>
  );
}
