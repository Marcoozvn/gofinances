import React, { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VictoryPie } from 'victory-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTheme } from 'styled-components';
import { addMonths, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { HistoryCard } from '../../components/HistoryCard';

import {
  Container,
  Header,
  Title,
  Content,
  ChartContainer,
  MonthSelect, 
  MonthSelectIcon,
  MonthSelectButton,
  Month,
  LoadContainer
} from './styles';
import { categories } from '../../utils/categories';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';


interface TransactionProps {
  id: string;
  type: 'positive' | 'negative';
  name: string;
  amount: string;
  category: string;
  date: string;
}

interface CategoryData {
  key: string;
  name: string;
  total: number;
  totalFormatted: string;
  color: string;
  percent: number;
  percentFormatted: string;
}

export function Resume() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [totalByCategories, setTotalByCategories] = useState<CategoryData[]>([]);

  const theme = useTheme();

  useFocusEffect(useCallback(() => {
    loadData()
  }, [selectedDate]));

  function handleDateChange(action: 'next' | 'prev') {
    if (action === 'next') {
      const newDate = addMonths(selectedDate, 1);
      setSelectedDate(newDate);
    } else {
      const newDate = subMonths(selectedDate, 1);
      setSelectedDate(newDate);
    }
  }

  async function loadData() {
    setIsLoading(true);
    const dataKey = '@gofinances:transactions';
    const response = await AsyncStorage.getItem(dataKey);
    const responseFormatted: TransactionProps[] = response ? JSON.parse(response) : [];

    const expenses = responseFormatted
      .filter(item => 
        item.type === 'negative' && 
        new Date(item.date).getMonth() === selectedDate.getMonth() && 
        new Date(item.date).getFullYear() === selectedDate.getFullYear()
      );

    const expensesSum = expenses.reduce((acc, item) => {
      return acc + Number(item.amount);
    }, 0);

    const totalByCategory: CategoryData[] = [];

    categories.forEach(category => {
      const categorySum = expenses.reduce((acc, item) => {
        if (item.category === category.key) {
          return acc + Number(item.amount)
        }

        return acc;
      }, 0);

      if (categorySum > 0) {
        const percent = (categorySum / expensesSum * 100);
        const percentFormatted = `${percent.toFixed(0)}%`;

        totalByCategory.push({
          ...category,
          percent,
          percentFormatted,
          total: categorySum,
          totalFormatted: categorySum.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          })
        });
      }
    });

    setTotalByCategories(totalByCategory);
    setIsLoading(false);
  }

  return (
    <Container>

      <Header>  
        <Title>Resumo por categoria</Title>
      </Header>

      { isLoading ? 
        <LoadContainer>
          <ActivityIndicator 
            color={theme.colors.primary}
            size='large' />
        </LoadContainer> :

        <Content 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: useBottomTabBarHeight()
          }}>

          <MonthSelect>
            <MonthSelectButton onPress={() => handleDateChange('prev')}>
              <MonthSelectIcon name='chevron-left' />
            </MonthSelectButton>

            <Month>{format(selectedDate, 'MMMM, yyyy', { locale: ptBR })}</Month>

            <MonthSelectButton onPress={() => handleDateChange('next')}>
              <MonthSelectIcon name='chevron-right'/>
            </MonthSelectButton>
          </MonthSelect>

          <ChartContainer>
            <VictoryPie
              data={totalByCategories}
              colorScale={totalByCategories.map(category => category.color)}
              style={{
                labels: { 
                  fontSize: RFValue(18),
                  fontWeight: 'bold',
                  fill: theme.colors.shape 
                }
              }}
              labelRadius={100}
              x="percentFormatted"
              y="total"
            />
          </ChartContainer>

          {totalByCategories.map(item => (
            <HistoryCard 
              key={item.key}
              title={item.name}
              amount={item.totalFormatted}
              color={item.color}
            />
          ))}
        </Content>
      }
    </Container>
  )
}