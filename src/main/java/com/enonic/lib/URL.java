package com.enonic.lib;


public class URL {
  public java.net.URL parse(String url)
    throws java.net.MalformedURLException {
      return new java.net.URL(url);
    }

  public java.net.URL resolve(String baseUrl, String url)
    throws java.net.MalformedURLException {
      return new java.net.URL(new java.net.URL(baseUrl), url); // .toExternalForm()
    }
}
