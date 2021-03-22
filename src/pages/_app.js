/* eslint-disable react/prop-types */
/* --------------------------------------------------------
* Author Trần Đức Tiến
* Email tientran0019@gmail.com
* Phone 0972970075
*
* Created: 2020-02-22 17:54:41
*------------------------------------------------------- */

/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import App from 'next/app';
import Head from 'next/head';

import { useDispatch } from 'react-redux';
import cookie from 'react-cookies';

import { useAsync } from 'react-use';

import NProgress from 'nprogress';
import Router from 'next/router';

import MainLayout from 'src/components/Layout/MainLayout';
import Loading from 'src/components/Loading';

import wrapperStore from 'src/redux';

import { actionGetUserAuth } from 'src/redux/actions/auth';

import AuthStorage from 'src/utils/auth-storage';

// uncomment if you don't want use redux
// export default MyApp;

import 'src/theme/index.less';
import 'src/theme/custom.less';
import 'src/theme/styles.less';

// const Noop = ({ children }) => children;

Router.events.on('routeChangeStart', url => {
	NProgress.start();
});
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

const urlsIgnore = ['/forgot-password', '/reset-password', '/login', '/sign-up', '/verify-email/[token]', '/reset-password/[token]'];

const MyApp = (props) => {
	const { Component, pageProps, router } = props;
	const [awaitLoading, setAwaitLoading] = React.useState(true);

	const dispatch = useDispatch();

	const Layout = Component.Layout || MainLayout;

	useAsync(async () => {
		if (AuthStorage.loggedIn) {
			try {
				await dispatch(await actionGetUserAuth());
			} catch (error) {
				if ((error.status === 403 || error.status === 401) && error.code !== 'AUTHORIZATION_REQUIRED') {
					AuthStorage.destroy();
					dispatch({ type: 'LOGOUT_SUCCESS' });

					if (router.pathname !== '/login') {
						router.push('/login');
					}
				}
			}
			setAwaitLoading(false);
		} else {
			setAwaitLoading(false);
		}
	}, [AuthStorage.loggedIn]);

	useAsync(async () => {
		if (!AuthStorage.loggedIn && typeof window !== 'undefined' && !urlsIgnore.includes(router.pathname)) {
			router.push('/login');
		}
	}, [router.pathname]);

	if (awaitLoading) {
		return (
			<div className="text-center">
				<Loading />
			</div>
		);
	}

	return (
		<Layout>
			<Head>
				<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, height=device-height, user-scalable=0" />
			</Head>
			<Component {...pageProps} router={router} />
		</Layout>
	);
};

// Only uncomment this method if you have blocking data requirements for
// every single page in your application. This disables the ability to
// perform automatic static optimization, causing every page in your app to
// be server-side rendered.

MyApp.getInitialProps = async (appContext) => {
	const { ctx, Component } = appContext;

	if (!process.browser) {
		cookie.plugToRequest(ctx.req, ctx.res);
	}

	if (!AuthStorage.loggedIn && !urlsIgnore.includes(ctx.pathname)) {
		if (ctx.res) {
			ctx.res?.writeHead?.(302, { Location: '/login' });
			ctx.res?.end?.();
		}
	}

	// calls page's `getInitialProps` and fills `appProps.pageProps`
	const { pageProps } = await App?.getInitialProps(appContext);

	let layoutProps = {};

	if (Component?.Layout) {
		layoutProps = await Component?.Layout?.getInitialProps?.({
			...appContext,
			pageProps,
		});
	} else {
		layoutProps = await MainLayout?.getInitialProps?.({
			...appContext,
			pageProps,
		});
	}

	return {
		pageProps: {
			...pageProps,
			...layoutProps,
		},
	};
};

// uncomment if you want to use redux
export default wrapperStore.withRedux(MyApp);