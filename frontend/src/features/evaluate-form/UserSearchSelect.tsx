import { useMemo, useState } from 'react';
import { SelectField } from '@smwb/summer-ui';
import { useGetUsersQuery } from '../../shared/api/api';
import { useDebouncedValue } from '../../shared/hooks/use-debounced-value';

const USERS_PAGE_SIZE = 20;

type Props = {
  value: string;
  onChange: (userId: string) => void;
};

export function UserSearchSelect({ value, onChange }: Props) {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput.trim());

  const { data, isFetching } = useGetUsersQuery({
    offset: 0,
    limit: USERS_PAGE_SIZE,
    search: debouncedSearch || undefined,
  });

  const items = useMemo(
    () =>
      (data?.users ?? []).map((user) => ({
        text: user.user_id,
        value: user.user_id,
        helperText: user.region,
      })),
    [data],
  );

  return (
    <SelectField
      label="User ID"
      value={value}
      items={items}
      search
      isLoading={isFetching}
      onSearch={(event) => setSearchInput(event.target.value)}
      onChange={(_event, selectData) => onChange(String(selectData.value ?? ''))}
    />
  );
}
