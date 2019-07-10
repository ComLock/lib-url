package com.enonic.lib;

import java.net.URL;

public class MYURL {
  public URL parse(String url)
    throws java.net.MalformedURLException {
      return new URL(url);
    }

  public URL resolve(String baseUrl, String url)
    throws java.net.MalformedURLException {
      return new URL(new URL(baseUrl), url); // .toExternalForm()
    }
}
