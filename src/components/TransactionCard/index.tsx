import React, { useMemo } from 'react';
import { categories } from '../../utils/categories';

import {
  Container,
  Title,
  Amount, 
  Footer, 
  Category, 
  Icon, 
  CategoryName,
  Date
} from './styles';

interface Props {
  data: {
    type: 'positive' | 'negative';
    name: string;
    amount: string;
    category: string;
    date: string;
  }
}

export function TransactionCard({ data }: Props) {

  const category = useMemo(() => {
    return categories.find(item => item.key === data.category)!;
  }, [data]);

  return (
    <Container>
      <Title>{data.name}</Title>
      <Amount type={data.type}>
        {data.type === 'negative' && '- '}
        {data.amount}
      </Amount>
      <Footer>
        <Category>
          <Icon name={category.icon} />
          <CategoryName>{category.name}</CategoryName>
        </Category>
        <Date>{data.date}</Date>
      </Footer>
    </Container>
  )
}