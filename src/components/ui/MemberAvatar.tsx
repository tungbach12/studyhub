import type { Member } from '../../types';

export default function MemberAvatar({
  member,
  size = 26,
  className = '',
}: {
  member: Pick<Member, 'name' | 'avatarUrl'> | null;
  size?: number;
  className?: string;
}) {
  if (member?.avatarUrl) {
    return (
      <img
        src={member.avatarUrl}
        alt={member.name}
        className={className}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-accent-2)',
        color: '#fff',
        fontSize: Math.round(size * 0.42),
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {member?.name?.charAt(0).toUpperCase() ?? '?'}
    </span>
  );
}
