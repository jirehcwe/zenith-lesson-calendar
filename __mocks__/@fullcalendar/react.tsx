const FullCalendar = ({
  eventClick,
  events,
}: {
  eventClick?: (arg: { event: any }) => void;
  events?: any[];
  [key: string]: any;
}) => (
  <div data-testid="fullcalendar">
    {events?.map((e: any, i: number) => (
      <button key={i} onClick={() => eventClick?.({ event: e })}>
        {e.title}
      </button>
    ))}
  </div>
);

export default FullCalendar;
